import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppCampaign, TesterApplication } from '../types';

export const ADMIN_UIDS = new Set([
  'UEqGXe9B52Wp0T5sXfxcC72a5mq2',
  'hJMZ8MAYrcRjHEOzxidDQwTjMI52',
]);

export type StoredRole = 'developer_pending' | 'developer' | 'admin';
export const isAdminUid = (uid?: string | null) => Boolean(uid && ADMIN_UIDS.has(uid));
const dateString = (value: unknown) => value instanceof Timestamp
  ? value.toDate().toISOString().slice(0, 10)
  : typeof value === 'string' ? value : new Date().toISOString().slice(0, 10);

export function publicCampaignFromDoc(id: string, data: Record<string, any>): AppCampaign {
  return {
    id,
    slug: data.slug,
    name: data.name,
    tagline: data.tagline || '',
    description: data.description || '',
    campaignGoal: data.campaignGoal || '',
    iconUrl: data.iconUrl || '',
    screenshots: data.screenshots || [],
    // This is intentionally only an owner id; private data is merged only for
    // a permitted dashboard session.
    developerId: data.developerId || '',
    developerName: data.developerName || '',
    platform: data.platform || 'android',
    testType: data.testType || 'google_play_closed',
    testUrl: '',
    version: data.version || '1.0.0',
    durationDays: data.durationDays || 14,
    requiredTestersCount: data.requiredTestersCount || 20,
    currentTestersCount: data.currentTestersCount || 0,
    targetCountries: data.targetCountries || [],
    targetDevices: data.targetDevices || [],
    minOsVersion: data.minOsVersion || '',
    testingInstructions: data.testingInstructions || '',
    rewardTitle: data.rewardTitle || '', rewardValue: data.rewardValue || '',
    reward: data.rewardTitle ? { type: 'cash', title: data.rewardTitle, value: data.rewardValue || '', description: '' } : undefined,
    category: data.category || 'tools',
    startDate: data.startDate || dateString(data.createdAt),
    endDate: data.endDate || '',
    status: data.status || 'draft',
    tasks: data.tasks || [],
    surveys: data.surveys || [],
    createdAt: dateString(data.createdAt),
    isFeatured: Boolean(data.isFeatured),
  };
}

export function applicationFromDoc(id: string, data: Record<string, any>): TesterApplication {
  return {
    id,
    campaignId: data.campaignId,
    appName: data.appName || '', appIcon: data.appIcon || '', platform: data.platform || 'android',
    testerId: data.testerId || 'anonymous', testerName: data.testerName, testerEmail: data.testerEmail,
    googlePlayEmail: data.googlePlayEmail || data.testerEmail, testerCountry: data.testerCountry || '',
    deviceModel: data.deviceModel || '', osType: data.osType, osVersion: data.osVersion || '',
    status: data.status || 'pending', appliedAt: dateString(data.createdAt),
    currentDay: data.currentDay || 0, completedTaskIds: data.completedTaskIds || [],
    activityScore: data.activityScore || 50, lastActiveDate: dateString(data.updatedAt || data.createdAt),
    developerNotes: data.developerNotes,
  };
}

export const subscribePublicCampaigns = (callback: (items: AppCampaign[]) => void) => onSnapshot(
  query(collection(db, 'publicCampaigns'), where('status', '==', 'active')),
  (snapshot) => callback(snapshot.docs.map((item) => publicCampaignFromDoc(item.id, item.data()))),
);

export const subscribeWorkspaceCampaigns = (uid: string, admin: boolean, callback: (items: AppCampaign[]) => void) => onSnapshot(
  admin ? collection(db, 'publicCampaigns') : query(collection(db, 'publicCampaigns'), where('developerId', '==', uid)),
  (snapshot) => callback(snapshot.docs.map((item) => publicCampaignFromDoc(item.id, item.data()))),
);

export const subscribePrivateCampaigns = (uid: string, admin: boolean, callback: (items: Map<string, any>) => void) => onSnapshot(
  admin ? collection(db, 'campaignPrivate') : query(collection(db, 'campaignPrivate'), where('developerId', '==', uid)),
  (snapshot) => callback(new Map(snapshot.docs.map((item) => [item.id, item.data()]))),
);

export const subscribeApplications = (uid: string, admin: boolean, callback: (items: TesterApplication[]) => void) => onSnapshot(
  admin ? collection(db, 'applications') : query(collection(db, 'applications'), where('developerId', '==', uid)),
  (snapshot) => callback(snapshot.docs.map((item) => applicationFromDoc(item.id, item.data()))),
);

export const submitDeveloperRequest = (uid: string, input: { name: string; companyName: string; email: string; bio?: string }) => setDoc(doc(db, 'developerRequests', uid), {
  uid,
  name: input.name,
  companyName: input.companyName,
  email: input.email,
  ...(input.bio ? { bio: input.bio } : {}),
  status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
}, { merge: true });

export const submitApplication = async (campaign: AppCampaign, input: Omit<TesterApplication, 'id' | 'campaignId' | 'appName' | 'appIcon' | 'platform' | 'status' | 'appliedAt' | 'currentDay' | 'completedTaskIds' | 'activityScore' | 'lastActiveDate'>, emailKey: string) => {
  // A deterministic id prevents normal client retries and duplicate form
  // submissions. Rules require this exact id and deny overwrites.
  const id = `${campaign.id}_${emailKey}`;
  await setDoc(doc(db, 'applications', id), {
    campaignId: campaign.id, developerId: campaign.developerId, appName: campaign.name, appIcon: campaign.iconUrl,
    platform: campaign.platform, ...input, emailKey, status: 'pending', currentDay: 0,
    completedTaskIds: [], activityScore: 50, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return id;
};

export const createCampaign = async (campaign: AppCampaign) => {
  const publicData = {
    name: campaign.name, slug: campaign.slug, developerId: campaign.developerId, developerName: campaign.developerName,
    platform: campaign.platform, testType: campaign.testType, category: campaign.category, tagline: campaign.tagline,
    description: campaign.description, campaignGoal: campaign.campaignGoal || '', iconUrl: campaign.iconUrl,
    durationDays: campaign.durationDays, requiredTestersCount: campaign.requiredTestersCount, currentTestersCount: 0,
    status: campaign.status, rewardTitle: campaign.rewardTitle || campaign.reward?.title || '', rewardValue: campaign.rewardValue || campaign.reward?.value || '',
    testingInstructions: campaign.testingInstructions, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'publicCampaigns', campaign.id), publicData);
  batch.set(doc(db, 'campaignPrivate', campaign.id), {
    developerId: campaign.developerId, testUrl: campaign.testUrl, internalNotes: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await batch.commit();
};

export const updateCampaignDocuments = async (id: string, updates: Partial<AppCampaign>) => {
  const { testUrl } = updates;
  // Keep updates aligned with the public document and its Security Rules.
  // In particular, never leak testUrl or reassign developerId.
  const allowedPublicKeys: (keyof AppCampaign)[] = ['name', 'slug', 'developerName', 'platform', 'testType', 'category', 'tagline', 'description', 'campaignGoal', 'iconUrl', 'durationDays', 'requiredTestersCount', 'status', 'rewardTitle', 'rewardValue', 'testingInstructions'];
  const publicUpdates = Object.fromEntries(allowedPublicKeys.flatMap((key) => updates[key] === undefined ? [] : [[key, updates[key]]]));
  if (Object.keys(publicUpdates).length) await updateDoc(doc(db, 'publicCampaigns', id), { ...publicUpdates, updatedAt: serverTimestamp() });
  if (typeof testUrl === 'string') await updateDoc(doc(db, 'campaignPrivate', id), { testUrl, updatedAt: serverTimestamp() });
};

export const deleteCampaignDocuments = async (id: string) => {
  await Promise.all([deleteDoc(doc(db, 'publicCampaigns', id)), deleteDoc(doc(db, 'campaignPrivate', id))]);
};

export const updateApplication = (id: string, values: Partial<TesterApplication>) => updateDoc(doc(db, 'applications', id), { ...values, updatedAt: serverTimestamp() });
export const decideDeveloperRequest = async (uid: string, decision: 'approve' | 'reject') => {
  // Approval and role change must be atomic; no temporary state can grant an
  // incomplete developer request access.
  const batch = writeBatch(db);
  batch.update(doc(db, 'developerRequests', uid), { status: decision === 'approve' ? 'approved' : 'rejected', updatedAt: serverTimestamp() });
  batch.set(doc(db, 'users', uid), { role: decision === 'approve' ? 'developer' : 'developer_pending', updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
};
export const setUserRole = (uid: string, role: 'developer' | 'developer_pending') => setDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() }, { merge: true });
export const subscribeDeveloperRequests = (callback: (items: any[]) => void) => onSnapshot(query(collection(db, 'developerRequests'), orderBy('createdAt', 'desc')), (snapshot) => callback(snapshot.docs.map((item) => ({ uid: item.id, ...item.data() }))));
