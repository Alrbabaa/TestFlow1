import { createHash } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const fail = (response, status, error) => response.status(status).json({ error });

const adminApp = () => {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT?.trim();
  if (!raw) throw new Error('firebase-admin-credentials-missing');
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const account = JSON.parse(json);
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error('firebase-admin-credentials-invalid');
  }
  account.private_key = account.private_key.replace(/\\n/g, '\n');
  return initializeApp({ credential: cert(account) });
};

const readBody = (body) => {
  if (typeof body !== 'string') return body;
  try { return JSON.parse(body); } catch { return null; }
};

const text = (value, max, required = false) => (
  typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0)
);

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return fail(response, 405, 'method-not-allowed');
  }

  const body = readBody(request.body);
  const campaignId = body?.campaignId;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const kind = body?.kind;
  if (!text(campaignId, 200, true) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(response, 400, 'invalid-request');
  }

  if (kind === 'feedback') {
    if (!['app', 'developer'].includes(body?.target)
      || !Number.isInteger(body?.rating) || body.rating < 1 || body.rating > 5
      || !text(body?.comment, 2000)) {
      return fail(response, 400, 'invalid-feedback');
    }
  } else if (kind === 'report') {
    if (!text(body?.title, 160, true) || !text(body?.description, 3000, true)
      || !['low', 'medium', 'high', 'critical'].includes(body?.severity)) {
      return fail(response, 400, 'invalid-report');
    }
  } else {
    return fail(response, 400, 'invalid-request');
  }

  try {
    const database = getFirestore(adminApp());
    const [campaignSnap, applicationQuery] = await Promise.all([
      database.collection('publicCampaigns').doc(campaignId).get(),
      database.collection('applications').where('campaignId', '==', campaignId).where('testerEmail', '==', email).limit(1).get(),
    ]);
    if (!campaignSnap.exists || applicationQuery.empty) return fail(response, 404, 'application-not-found');

    const applicationSnap = applicationQuery.docs[0];
    const application = applicationSnap.data();
    if (!['accepted', 'waiting_for_whitelisting', 'ready_to_join', 'joined', 'active', 'completed'].includes(application.status)) {
      return fail(response, 403, 'application-not-accepted');
    }

    const isFeedback = kind === 'feedback';
    const target = body.target;
    const collectionName = isFeedback ? 'testerFeedback' : 'adminReports';
    const suffix = isFeedback ? `feedback_${target}` : 'report';
    const documentId = `${suffix}_${createHash('sha256').update(applicationSnap.id).digest('hex')}`;
    const recordRef = database.collection(collectionName).doc(documentId);
    const record = isFeedback
      ? {
          campaignId, applicationId: applicationSnap.id, appName: campaignSnap.data().name || '',
          testerId: application.testerId || 'anonymous', testerName: application.testerName || '',
          target, rating: body.rating, category: 'general', comment: body.comment.trim(),
          createdAt: FieldValue.serverTimestamp(),
        }
      : {
          campaignId, applicationId: applicationSnap.id, appName: campaignSnap.data().name || '',
          testerId: application.testerId || 'anonymous', testerName: application.testerName || '',
          title: body.title.trim(), description: body.description.trim(), severity: body.severity,
          status: 'open', createdAt: FieldValue.serverTimestamp(),
        };

    const wasCreated = await database.runTransaction(async (transaction) => {
      const existing = await transaction.get(recordRef);
      if (existing.exists) return false;
      transaction.create(recordRef, record);
      return true;
    });
    if (!wasCreated) return fail(response, 409, 'already-submitted');
    return response.status(201).json({ ok: true });
  } catch (error) {
    const code = typeof error?.code === 'string' ? error.code : 'unknown';
    console.error('Tester feedback submission failed.', { code, campaignId, kind });
    return fail(response, 503, 'submission-unavailable');
  }
}
