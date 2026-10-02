import 'dotenv/config';
import express from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { requireAuth, requireRole, AuthRequest } from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  getOrCreateUser,
  getAllCampaigns,
  getCampaignBySlug,
  getCampaignById,
  getCampaignsForDeveloper,
  getUserByUid,
  submitDeveloperRequest,
  getPendingDeveloperRequests,
  decideDeveloperRequest,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getApplicationsForTester,
  getApplicationsForDeveloper,
  getAllApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  getAllBugReports,
  createBugReport,
  updateBugReport,
  getAllFeedbacks,
  createFeedback,
  seedDatabaseIfEmpty,
} from './src/db/helpers.ts';
import { checkDatabaseHealth } from './src/db/index.ts';
import { safeDatabaseErrorCode } from './src/db/config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// The production server is bundled into dist-server/server.js while the Vite
// client is built into dist. Keep these paths separate so Cloud Run serves the
// compiled client rather than TypeScript source files.
const clientDistPath = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '../dist')
  : path.resolve(__dirname, 'dist');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Seed initial data once lazily
seedDatabaseIfEmpty().catch((err) => {
  console.warn(`Database initialization skipped (${safeDatabaseErrorCode(err)}).`);
});

// Health check
app.get('/api/health', async (_req, res) => {
  const database = await checkDatabaseHealth();
  const healthy = database.status === 'ok';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    server: 'ok',
    database,
    timestamp: new Date().toISOString(),
  });
});

// User sync (Firebase Auth to Cloud SQL)
app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(400).json({ error: 'User UID missing in token' });
    }

    const { name } = req.body || {};
    let email = req.user.email;

    if (!email) {
      const firebaseUser = await adminAuth.getUser(req.user.uid);
      email = firebaseUser.email;
    }

    if (!email) {
      return res.status(400).json({ error: 'User email not available' });
    }

    const adminUids = (process.env.ADMIN_UIDS || '').split(',').map((uid) => uid.trim()).filter(Boolean);
    const user = await getOrCreateUser(req.user.uid, email, name, adminUids);
    res.json({ user });
  } catch (error: any) {
    console.error('USER SYNC REAL ERROR:', error);
    res.status(503).json({ error: 'Account storage is temporarily unavailable.' });
  }
});

app.get('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) return res.status(404).json({ error: 'User profile not found' });
    res.json({ role: user.role });
  } catch (error: any) {
    console.error(`Could not load user role (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to load account permissions' });
  }
});

app.post('/api/developer-requests', requireAuth, async (req: AuthRequest, res) => {
  const name = String(req.body?.name || req.user?.name || '').trim().slice(0, 120);
  const companyName = String(req.body?.companyName || '').trim().slice(0, 160);
  if (!name || !companyName) {
    return res.status(400).json({ error: 'Name and company name are required' });
  }
  try {
    const request = await submitDeveloperRequest(req.user!.uid, name, companyName);
    if (!request) return res.status(409).json({ error: 'Account cannot submit a developer request' });
    res.status(201).json({ status: request.role });
  } catch (error: any) {
    console.error(`Could not submit developer request (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to submit developer request' });
  }
});

app.get('/api/admin/developer-requests', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    res.json(await getPendingDeveloperRequests());
  } catch (error: any) {
    console.error(`Could not load developer requests (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to load developer requests' });
  }
});

app.post('/api/admin/developer-requests/:uid', requireAuth, requireRole('admin'), async (req, res) => {
  const decision = req.body?.decision;
  if (decision !== 'approve' && decision !== 'reject') {
    return res.status(400).json({ error: 'Decision must be approve or reject' });
  }
  try {
    const updated = await decideDeveloperRequest(req.params.uid, decision === 'approve');
    if (!updated) return res.status(404).json({ error: 'Developer request not found' });
    res.json({ status: updated.role });
  } catch (error: any) {
    console.error(`Could not decide developer request (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to update developer request' });
  }
});

const toPublicCampaign = (campaign: any) => {
  if (!campaign) return campaign;
  const { testUrl: _testUrl, ...publicCampaign } = campaign;
  return publicCampaign;
};

// Campaigns API
app.get('/api/campaigns', async (_req, res) => {
  try {
    const list = await getAllCampaigns();
    res.json(list.map(toPublicCampaign));
  } catch (error: any) {
    console.error(`[Server] Campaign query failed (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Campaign storage is temporarily unavailable.' });
  }
});

app.get('/api/campaigns/:slug', async (req, res) => {
  try {
    const campaign = await getCampaignBySlug(req.params.slug);
    if (campaign) {
      return res.json(toPublicCampaign(campaign));
    }
    return res.status(404).json({ error: 'Campaign not found' });
  } catch (error: any) {
    console.error(`[Server] Campaign lookup failed (${safeDatabaseErrorCode(error)}).`);
    return res.status(503).json({ error: 'Campaign storage is temporarily unavailable.' });
  }
});

app.get('/api/admin/campaigns', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    res.json(await getAllCampaigns());
  } catch (error: any) {
    console.error(`[Server] Admin campaign read failed (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to load campaigns' });
  }
});

app.get('/api/developer/campaigns', requireAuth, requireRole('developer'), async (req: AuthRequest, res) => {
  try {
    res.json(await getCampaignsForDeveloper(req.user!.uid));
  } catch (error: any) {
    console.error(`[Server] Developer campaign read failed (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to load owned campaigns' });
  }
});

app.post('/api/campaigns', requireAuth, requireRole('developer', 'admin'), async (req: AuthRequest, res) => {
  const data = { ...req.body };
  if (req.user?.uid) data.developerId = req.user.uid;
  const newCamp = {
    ...data,
    id: data.id || `camp-${Date.now()}`,
    createdAt: new Date(),
    currentTestersCount: 0,
  };
  try {
    const saved = await createCampaign(data);
    res.status(201).json(saved);
  } catch (error: any) {
    console.error(`[Server] Campaign was not persisted (${safeDatabaseErrorCode(error)}).`);
      res.status(503).json({ error: 'Campaign storage is temporarily unavailable.' });
  }
});

app.patch('/api/campaigns/:id', requireAuth, requireRole('developer', 'admin'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  let campaign;
  let role;
  try {
    campaign = await getCampaignById(id);
    role = (await getUserByUid(req.user!.uid))?.role;
  } catch (error: any) {
    console.error(`[Server] Campaign authorization lookup failed (${safeDatabaseErrorCode(error)}).`);
    return res.status(503).json({ error: 'Unable to verify campaign access' });
  }
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (role !== 'admin' && campaign.developerId !== req.user!.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { developerId: _developerId, id: _id, ...updates } = req.body || {};

  try {
    const updated = await updateCampaign(id, updates);
    res.json(toPublicCampaign(updated));
  } catch (error: any) {
    console.error(`[Server] Campaign update failed (${safeDatabaseErrorCode(error)}).`);
      res.status(503).json({ error: 'Campaign storage is temporarily unavailable.' });
  }
});

app.delete('/api/campaigns/:id', requireAuth, requireRole('developer', 'admin'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  let campaign;
  let role;
  try {
    campaign = await getCampaignById(id);
    role = (await getUserByUid(req.user!.uid))?.role;
  } catch (error: any) {
    console.error(`[Server] Campaign authorization lookup failed (${safeDatabaseErrorCode(error)}).`);
    return res.status(503).json({ error: 'Unable to verify campaign access' });
  }
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (role !== 'admin' && campaign.developerId !== req.user!.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await deleteCampaign(id);
  } catch (error: any) {
    console.error(`[Server] Campaign deletion failed (${safeDatabaseErrorCode(error)}).`);
      return res.status(503).json({ error: 'Campaign storage is temporarily unavailable.' });
  }
  res.json({ success: true, id });
});

// Applications API
app.get('/api/applications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const list = await getApplicationsForTester(req.user!.uid);
    res.json(list);
  } catch (error: any) {
    console.error(`[Server] Could not retrieve tester applications (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to retrieve applications' });
  }
});

app.get('/api/admin/applications', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    res.json(await getAllApplications());
  } catch (error: any) {
    console.error(`[Server] Admin application read failed (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to load applications' });
  }
});

app.get('/api/developer/applications', requireAuth, requireRole('developer'), async (req: AuthRequest, res) => {
  try {
    res.json(await getApplicationsForDeveloper(req.user!.uid));
  } catch (error: any) {
    console.error(`[Server] Developer application read failed (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to load owned applications' });
  }
});

app.get('/api/applications/:id/test-link', async (req, res) => {
  try {
    const application = await getApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (!['ready_to_join', 'joined', 'active', 'completed'].includes(application.status)) {
      return res.status(403).json({ error: 'Test link is not available for this application' });
    }
    const campaign = await getCampaignById(application.campaignId);
    if (!campaign?.testUrl) return res.status(404).json({ error: 'Test link not found' });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.json({ testUrl: campaign.testUrl });
  } catch (error: any) {
    console.error(`[Server] Could not retrieve authorized test link (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Unable to retrieve test link' });
  }
});

app.post('/api/applications', async (req, res) => {
  const { campaignId, testerName, testerEmail, googlePlayEmail, country, osType, osVersion, deviceModel } = req.body || {};
  if (!campaignId || typeof testerName !== 'string' || !testerName.trim() ||
      typeof testerEmail !== 'string' || !testerEmail.includes('@') ||
      !['android', 'ios'].includes(osType) || !deviceModel) {
    return res.status(400).json({ error: 'Invalid tester application' });
  }
  let campaign;
  try {
    campaign = await getCampaignById(campaignId);
  } catch (error: any) {
    console.error(`[Server] Campaign lookup for application failed (${safeDatabaseErrorCode(error)}).`);
    return res.status(503).json({ error: 'Unable to verify campaign' });
  }
  if (!campaign || campaign.status !== 'active') {
    return res.status(404).json({ error: 'Active campaign not found' });
  }
  const newApp = {
    campaignId,
    testerId: `anonymous-${randomUUID()}`,
    testerName: testerName.trim().slice(0, 120),
    testerEmail: testerEmail.trim().toLowerCase().slice(0, 254),
    googlePlayEmail: String(googlePlayEmail || testerEmail).trim().toLowerCase().slice(0, 254),
    country: String(country || '').slice(0, 120),
    osType,
    osVersion: String(osVersion || '').slice(0, 120),
    deviceModel: String(deviceModel).trim().slice(0, 160),
    status: 'pending',
    id: `app-${randomUUID()}`,
    appliedAt: new Date(),
  };

  try {
    const created = await createApplication(newApp);
    res.status(201).json(created);
  } catch (error: any) {
    if (error?.cause?.message === 'APPLICATION_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'An application with this email already exists for this campaign.' });
    }
    console.error(`[Server] Application creation failed (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Application storage is temporarily unavailable. Please retry shortly.' });
  }
});

app.patch('/api/applications/:id', requireAuth, requireRole('developer', 'admin'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const application = await getApplicationById(id).catch(() => null);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const campaign = await getCampaignById(application.campaignId).catch(() => null);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const role = (await getUserByUid(req.user!.uid).catch(() => null))?.role;
  if (role !== 'admin' && campaign.developerId !== req.user!.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const allowedStatuses = [
    'pending', 'accepted', 'waiting_for_whitelisting', 'ready_to_join', 'joined',
    'active', 'completed', 'inactive', 'rejected',
  ];
  const status = req.body?.status;
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid application status' });
  }
  const updates = { status, notes: String(req.body?.notes || '').slice(0, 2000) };

  try {
    const updated = await updateApplication(id, updates);
    res.json(updated);
  } catch (error: any) {
    console.error(`[Server] Application update failed (${safeDatabaseErrorCode(error)}).`);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Bug Reports API
app.get('/api/bug-reports', requireAuth, requireRole('admin'), async (req, res) => {
  const campaignId = req.query.campaignId as string | undefined;

  try {
    const list = await getAllBugReports(campaignId);
    res.json(list);
  } catch (error: any) {
    console.error(`[Server] Bug report query failed (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Bug report storage is temporarily unavailable.' });
  }
});

app.post('/api/bug-reports', requireAuth, async (req: AuthRequest, res) => {
  const { campaignId, title, description, severity, stepsToReproduce, deviceInfo } = req.body || {};
  if (!campaignId || !title || !description || !['low', 'medium', 'high', 'critical'].includes(severity)) {
    return res.status(400).json({ error: 'Invalid bug report' });
  }
  const newBug = {
    campaignId,
    title: String(title).slice(0, 200),
    description: String(description).slice(0, 10000),
    severity,
    stepsToReproduce: String(stepsToReproduce || '').slice(0, 5000),
    deviceInfo: String(deviceInfo || '').slice(0, 1000),
    testerId: req.user!.uid,
    testerEmail: req.user!.email || '',
    testerName: req.user!.name || req.user!.email || 'Tester',
    status: 'new',
    id: `bug-${Date.now()}`,
    createdAt: new Date(),
  };

  try {
    const created = await createBugReport(newBug);
    res.status(201).json(created);
  } catch (error: any) {
    console.error(`[Server] Bug report creation failed (${safeDatabaseErrorCode(error)}).`);
      res.status(503).json({ error: 'Bug report storage is temporarily unavailable.' });
  }
});

app.patch('/api/bug-reports/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await updateBugReport(id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.json({ id, ...req.body });
  }
});

// Feedbacks API
app.get('/api/feedbacks', requireAuth, requireRole('admin'), async (req, res) => {
  const campaignId = req.query.campaignId as string | undefined;

  try {
    const list = await getAllFeedbacks(campaignId);
    res.json(list);
  } catch (error: any) {
    console.error(`[Server] Feedback query failed (${safeDatabaseErrorCode(error)}).`);
    res.status(503).json({ error: 'Feedback storage is temporarily unavailable.' });
  }
});

app.post('/api/feedbacks', requireAuth, async (req: AuthRequest, res) => {
  const { campaignId, rating, category, comment } = req.body || {};
  if (!campaignId || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      !['ui_ux', 'performance', 'feature_request', 'general'].includes(category) ||
      typeof comment !== 'string' || comment.length > 10000) {
    return res.status(400).json({ error: 'Invalid feedback' });
  }
  try {
    const newFb = await createFeedback({
      campaignId,
      rating,
      category,
      comment,
      testerId: req.user!.uid,
      testerName: req.user!.name || req.user!.email || 'Tester',
      id: `feedback-${Date.now()}`,
    });
    res.status(201).json(newFb);
  } catch (error: any) {
    console.error(`Error submitting feedback (${safeDatabaseErrorCode(error)}).`);
      res.status(503).json({ error: 'Feedback storage is temporarily unavailable.' });
  }
});

// Vite Middleware for development / Static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(clientDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(clientDistPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TestFlow server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
