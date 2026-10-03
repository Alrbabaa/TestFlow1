import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Keep this list aligned with firestore.rules. A document role is also
// accepted so that future administrators can be managed from the dashboard.
const bootstrapAdminUids = new Set([
  'UEqGXe9B52Wp0T5sXfxcC72a5mq2',
  'hJMZ8MAYrcRjHEOzxidDQwTjMI52',
]);

const fail = (response, status, error) => response.status(status).json({ error });

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT?.trim();
  if (!raw) throw new Error('firebase-admin-credentials-missing');

  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const account = JSON.parse(json);
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error('firebase-admin-credentials-invalid');
  }
  account.private_key = account.private_key.replace(/\\n/g, '\n');
  return account;
};

const adminApp = () => {
  if (getApps().length) return getApps()[0];
  return initializeApp({ credential: cert(parseServiceAccount()) });
};

const requestValue = (body, key) => {
  const value = body?.[key];
  return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : null;
};

const readBody = (body) => {
  if (typeof body !== 'string') return body;
  try { return JSON.parse(body); } catch { return null; }
};

const invitationText = ({ campaignName, testerName, testUrl }) => `مرحباً ${testerName || 'بك'}،

تم قبول طلبك لاختبار ${campaignName} عبر TestFlow.

رابط الاختبار:
${testUrl}

إذا كان الرابط لا يعمل بعد، فتأكد من أنك تستخدم البريد الذي تم تسجيله وأن صاحب الحملة أضافه إلى قائمة الاختبار في Google Play أو TestFlight.

مع تحيات فريق TestFlow`;

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return fail(response, 405, 'method-not-allowed');
  }

  const authHeader = request.headers.authorization;
  const idToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';
  if (!idToken) return fail(response, 401, 'authentication-required');

  const body = readBody(request.body);
  const campaignId = requestValue(body, 'campaignId');
  const applicationId = requestValue(body, 'applicationId');
  if (!campaignId || !applicationId) return fail(response, 400, 'invalid-request');

  try {
    const app = adminApp();
    const [identity, database] = [getAuth(app), getFirestore(app)];
    const caller = await identity.verifyIdToken(idToken, true);

    const [privateSnap, publicSnap, applicationSnap, callerProfile] = await Promise.all([
      database.collection('campaignPrivate').doc(campaignId).get(),
      database.collection('publicCampaigns').doc(campaignId).get(),
      database.collection('applications').doc(applicationId).get(),
      database.collection('users').doc(caller.uid).get(),
    ]);

    if (!privateSnap.exists || !publicSnap.exists || !applicationSnap.exists) {
      return fail(response, 404, 'record-not-found');
    }

    const privateCampaign = privateSnap.data();
    const publicCampaign = publicSnap.data();
    const application = applicationSnap.data();
    const isAdmin = bootstrapAdminUids.has(caller.uid) || callerProfile.data()?.role === 'admin';
    const ownsCampaign = privateCampaign?.developerId === caller.uid;

    if (!isAdmin && !ownsCampaign) return fail(response, 403, 'campaign-access-denied');
    if (application?.campaignId !== campaignId) return fail(response, 400, 'application-campaign-mismatch');
    if (application?.status !== 'ready_to_join') return fail(response, 409, 'tester-not-ready');

    const testUrl = privateCampaign?.testUrl;
    const recipient = application?.testerEmail;
    if (typeof testUrl !== 'string' || !testUrl.startsWith('https://') || typeof recipient !== 'string' || !recipient.includes('@')) {
      return fail(response, 409, 'invitation-details-unavailable');
    }

    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!resendKey || !from) {
      console.error('Tester invitation service is not configured.');
      return fail(response, 503, 'email-service-unavailable');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: `تم قبولك لاختبار ${publicCampaign?.name || 'تطبيق'} عبر TestFlow`,
        text: invitationText({
          campaignName: publicCampaign?.name || 'التطبيق',
          testerName: application?.testerName,
          testUrl,
        }),
      }),
    });

    if (!resendResponse.ok) {
      // Do not log provider responses because they can contain recipient data.
      console.error('Resend rejected tester invitation.', { status: resendResponse.status, campaignId, applicationId });
      return fail(response, 502, 'email-delivery-failed');
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    const code = typeof error?.code === 'string' ? error.code : 'unknown';
    console.error('Tester invitation failed.', { code, campaignId, applicationId });
    if (code.startsWith('auth/')) return fail(response, 401, 'authentication-invalid');
    return fail(response, 503, 'invitation-service-unavailable');
  }
}
