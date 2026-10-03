import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createCampaign as createFirestoreCampaign, decideDeveloperRequest, setUserRole, submitApplication as submitFirestoreApplication, submitDeveloperRequest, subscribeApplications, subscribeDeveloperRequests, subscribePrivateCampaigns, subscribePublicCampaigns, subscribeWorkspaceCampaigns, updateApplication as updateFirestoreApplication, updateCampaignDocuments, deleteCampaignDocuments } from '../lib/firestore';
import { useAuth } from './AuthContext';
import type { AppCampaign, BugReport, DeveloperUser, EmailNotification, ReputationLevel, SecurityAuditEntry, TesterApplication, TesterFeedback, TesterStatus, TesterUser, UserRole } from '../types';

type Toast = { message: string; type: 'success' | 'info' | 'warning' | 'error'; id: number } | null;
interface AppContextType {
  currentUserRole: UserRole; setCurrentUserRole: (role: UserRole) => void;
  currentTester: TesterUser; currentDeveloper: DeveloperUser; setCurrentTester: (tester: TesterUser) => void; setCurrentDeveloper: (dev: DeveloperUser) => void;
  campaigns: AppCampaign[]; applications: TesterApplication[]; developers: DeveloperUser[]; testers: TesterUser[];
  bugReports: BugReport[]; feedbacks: TesterFeedback[]; emails: EmailNotification[];
  securityLogs: SecurityAuditEntry[]; logSecurityEvent: (event: Omit<SecurityAuditEntry, 'id' | 'timestamp'>) => void;
  isEmailMasked: boolean; setIsEmailMasked: (masked: boolean) => void; isLockdownMode: boolean; setIsLockdownMode: (locked: boolean) => void;
  isAntiBotEnabled: boolean; setIsAntiBotEnabled: (enabled: boolean) => void; isWatermarkEnforced: boolean; setIsWatermarkEnforced: (enabled: boolean) => void;
  isTwoFactorEnabled: boolean; setIsTwoFactorEnabled: (enabled: boolean) => void; clearSecurityLogs: () => void;
  blockSuspiciousIp: (ip: string, reason: string) => void; simulateCyberAttackTest: () => void;
  selectedCampaignSlug: string | null; setSelectedCampaignSlug: (slug: string | null) => void; activeTab: string; setActiveTab: (tab: string) => void;
  toast: Toast; showToast: (message: string, type?: NonNullable<Toast>['type']) => void; hideToast: () => void;
  applyToCampaign: (campaignId: string, formData: { name: string; email: string; googlePlayEmail: string; country: string; osType: 'android' | 'ios'; osVersion: string; deviceModel: string }) => Promise<{ success: boolean; message: string; applicationId?: string }>;
  toggleTaskCompletion: (applicationId: string, taskId: string) => void; submitBugReport: (campaignId: string, title: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical', steps: string, deviceInfo: string) => void;
  submitFeedback: (campaignId: string, rating: number, category: 'ui_ux' | 'performance' | 'feature_request' | 'general', comment: string, taskId?: string) => void;
  confirmTesterJoined: (applicationId: string) => void; requestDataDeletion: (email: string) => void;
  addCampaign: (campaign: Omit<AppCampaign, 'id' | 'createdAt' | 'currentTestersCount'>) => Promise<string>;
  updateCampaign: (campaignId: string, updates: Partial<AppCampaign>) => Promise<boolean>; removeCampaign: (campaignId: string) => Promise<boolean>;
  updateApplicationStatus: (applicationId: string, newStatus: TesterStatus, notes?: string) => void; confirmWhitelisted: (applicationId: string) => void; confirmBulkWhitelisted: (applicationIds: string[]) => void;
  updateBugStatus: (bugId: string, status: BugReport['status']) => void; registerDeveloper: (dev: { name: string; companyName: string; email: string; phone?: string; bio?: string; website?: string }) => Promise<void>;
  updateDeveloperStatus: (devId: string, status: DeveloperUser['status']) => void; updateTesterStatus: (testerId: string, status: TesterUser['status']) => void;
  updateTesterReputation: (testerId: string, level: ReputationLevel, score: number) => void; toggleCampaignFeatured: (campaignId: string) => void;
  markEmailAsRead: (emailId: string) => void; unreadEmailsCount: number; resetToDemoData: () => void;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
const today = () => new Date().toISOString().slice(0, 10);
const emptyTester: TesterUser = { id: 'guest', name: 'Guest', email: '', country: '', osPreference: 'android', deviceModel: '', osVersion: '', joinedDate: today(), isVerified: false, status: 'active', activityScore: 50, reputation: { level: 'new', score: 50, completedTests: 0, commitmentRate: 100, helpfulFeedbackCount: 0, bugsFoundCount: 0, dropoutsCount: 0, taskCompletionRate: 100 } };
const emptyDeveloper: DeveloperUser = { id: '', name: '', companyName: '', email: '', status: 'pending_approval', submittedAt: today(), appsCount: 0 };

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole, roleLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<AppCampaign[]>([]); const [applications, setApplications] = useState<TesterApplication[]>([]);
  const [developers, setDevelopers] = useState<DeveloperUser[]>([]); const [testers, setTesters] = useState<TesterUser[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]); const [feedbacks, setFeedbacks] = useState<TesterFeedback[]>([]); const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditEntry[]>([]); const [selectedCampaignSlug, setSelectedCampaignSlug] = useState<string | null>(null); const [activeTab, setActiveTab] = useState('home'); const [toast, setToast] = useState<Toast>(null);
  const [isEmailMasked, setIsEmailMasked] = useState(true); const [isLockdownMode, setIsLockdownMode] = useState(false); const [isAntiBotEnabled, setIsAntiBotEnabled] = useState(true); const [isWatermarkEnforced, setIsWatermarkEnforced] = useState(true); const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [roleOverride, setCurrentUserRole] = useState<UserRole>('tester'); const [currentTester, setCurrentTester] = useState<TesterUser>(emptyTester); const [currentDeveloper, setCurrentDeveloper] = useState<DeveloperUser>(emptyDeveloper);
  const currentUserRole = (userRole === 'admin' || userRole === 'developer') ? userRole : 'tester';
  const showToast = (message: string, type: NonNullable<Toast>['type'] = 'success') => { const id = Date.now(); setToast({ message, type, id }); window.setTimeout(() => setToast((item) => item?.id === id ? null : item), 4000); };
  const logSecurityEvent = (event: Omit<SecurityAuditEntry, 'id' | 'timestamp'>) => setSecurityLogs((items) => [{ ...event, id: crypto.randomUUID(), timestamp: new Date().toISOString() }, ...items]);

  useEffect(() => {
    const privileged = user && !roleLoading && (userRole === 'admin' || userRole === 'developer');
    return privileged ? subscribeWorkspaceCampaigns(user.uid, userRole === 'admin', setCampaigns) : subscribePublicCampaigns(setCampaigns);
  }, [user, userRole, roleLoading]);
  useEffect(() => {
    if (!user || roleLoading || (userRole !== 'admin' && userRole !== 'developer')) { setApplications([]); return; }
    const admin = userRole === 'admin'; let privateData = new Map<string, any>();
    const applyPrivate = () => setCampaigns((items) => items.map((campaign) => ({ ...campaign, testUrl: privateData.get(campaign.id)?.testUrl || '' })));
    const stopPrivate = subscribePrivateCampaigns(user.uid, admin, (items) => { privateData = items; applyPrivate(); });
    const stopApps = subscribeApplications(user.uid, admin, setApplications);
    return () => { stopPrivate(); stopApps(); };
  }, [user, userRole, roleLoading]);
  useEffect(() => {
    if (userRole !== 'admin') { setDevelopers([]); return; }
    return subscribeDeveloperRequests((requests) => setDevelopers(requests.map((request) => ({ id: request.uid, name: request.name || '', companyName: request.companyName || '', email: request.email || '', bio: request.bio || '', status: request.status === 'approved' ? 'approved' : request.status === 'rejected' ? 'rejected' : 'pending_approval', submittedAt: today(), appsCount: 0 }))));
  }, [userRole]);
  useEffect(() => {
    if (!user) { setCurrentTester(emptyTester); setCurrentDeveloper(emptyDeveloper); return; }
    setCurrentTester({ ...emptyTester, id: user.uid, name: user.displayName || 'User', email: user.email || '', googlePlayGmail: user.email || '', avatarUrl: user.photoURL || undefined, isVerified: true });
    if (userRole === 'developer' || userRole === 'developer_pending') return onSnapshot(doc(db, 'developerRequests', user.uid), (snap) => { const data = snap.data(); setCurrentDeveloper({ id: user.uid, name: data?.name || user.displayName || '', companyName: data?.companyName || '', email: user.email || '', status: userRole === 'developer' ? 'approved' : 'pending_approval', submittedAt: today(), appsCount: 0 }); });
    setCurrentDeveloper({ ...emptyDeveloper, id: user.uid, name: user.displayName || '', email: user.email || '', status: userRole === 'admin' ? 'approved' : 'pending_approval' });
  }, [user, userRole]);

  const applyToCampaign: AppContextType['applyToCampaign'] = async (campaignId, form) => {
    const campaign = campaigns.find((item) => item.id === campaignId); const email = form.email.trim().toLowerCase();
    if (!campaign || !email.includes('@') || !form.name.trim()) return { success: false, message: 'Please enter your name and a valid email.' };
    const emailKey = btoa(email).replace(/=+$/g, '').replace(/[+/]/g, '_');
    try { const id = await submitFirestoreApplication(campaign, { testerId: 'anonymous', testerName: form.name.trim(), testerEmail: email, googlePlayEmail: form.googlePlayEmail.trim().toLowerCase(), testerCountry: form.country.trim(), deviceModel: form.deviceModel.trim(), osType: form.osType, osVersion: form.osVersion.trim() }, emailKey); return { success: true, message: 'Application submitted.', applicationId: id }; }
    catch (error: any) { return { success: false, message: error?.code === 'permission-denied' ? 'This application was already submitted or the campaign is unavailable.' : 'Could not submit your application.' }; }
  };
  const addCampaign: AppContextType['addCampaign'] = async (data) => { if (!user || (userRole !== 'admin' && userRole !== 'developer')) throw new Error('Developer access is required.'); const id = crypto.randomUUID(); const campaign: AppCampaign = { ...data, id, developerId: user.uid, currentTestersCount: 0, createdAt: today() }; await createFirestoreCampaign(campaign); return id; };
  const updateCampaign: AppContextType['updateCampaign'] = async (id, updates) => { try { await updateCampaignDocuments(id, updates); return true; } catch { showToast('Could not save campaign changes.', 'error'); return false; } };
  const removeCampaign: AppContextType['removeCampaign'] = async (id) => { try { await deleteCampaignDocuments(id, campaigns.find((campaign) => campaign.id === id)?.slug); return true; } catch { showToast('Could not delete campaign.', 'error'); return false; } };
  const updateApplicationStatus = (id: string, status: TesterStatus, notes?: string) => { void updateFirestoreApplication(id, { status, ...(notes ? { developerNotes: notes } : {}) }).catch(() => showToast('Could not update application.', 'error')); };
  const registerDeveloper = async (input: Parameters<AppContextType['registerDeveloper']>[0]) => {
    if (!user) throw new Error('Google sign-in is required.');
    await submitDeveloperRequest(user.uid, input);
    await setUserRole(user.uid, 'developer_pending');
    showToast('Developer request submitted.');
  };
  const updateDeveloperStatus = (id: string, status: DeveloperUser['status']) => { void decideDeveloperRequest(id, status === 'approved' ? 'approve' : 'reject').catch(() => showToast('Could not update developer request.', 'error')); };
  const toggleTaskCompletion = (id: string, taskId: string) => { const app = applications.find((item) => item.id === id); if (app) void updateFirestoreApplication(id, { completedTaskIds: app.completedTaskIds.includes(taskId) ? app.completedTaskIds.filter((item) => item !== taskId) : [...app.completedTaskIds, taskId] }); };
  const confirmTesterJoined = (id: string) => updateApplicationStatus(id, 'active'); const confirmWhitelisted = (id: string) => updateApplicationStatus(id, 'ready_to_join'); const noop = () => undefined;
  const value = useMemo<AppContextType>(() => ({
    currentUserRole: roleOverride === 'tester' ? currentUserRole : roleOverride, setCurrentUserRole, currentTester, currentDeveloper, setCurrentTester, setCurrentDeveloper, campaigns, applications, developers, testers, bugReports, feedbacks, emails, securityLogs, logSecurityEvent,
    isEmailMasked, setIsEmailMasked, isLockdownMode, setIsLockdownMode, isAntiBotEnabled, setIsAntiBotEnabled, isWatermarkEnforced, setIsWatermarkEnforced, isTwoFactorEnabled, setIsTwoFactorEnabled, clearSecurityLogs: () => setSecurityLogs([]), blockSuspiciousIp: noop, simulateCyberAttackTest: noop,
    selectedCampaignSlug, setSelectedCampaignSlug, activeTab, setActiveTab, toast, showToast, hideToast: () => setToast(null), applyToCampaign, toggleTaskCompletion, submitBugReport: noop as AppContextType['submitBugReport'], submitFeedback: noop as AppContextType['submitFeedback'], confirmTesterJoined, requestDataDeletion: noop,
    addCampaign, updateCampaign, removeCampaign, updateApplicationStatus, confirmWhitelisted, confirmBulkWhitelisted: (ids) => ids.forEach(confirmWhitelisted), updateBugStatus: noop as AppContextType['updateBugStatus'], registerDeveloper, updateDeveloperStatus, updateTesterStatus: noop as AppContextType['updateTesterStatus'], updateTesterReputation: noop as AppContextType['updateTesterReputation'], toggleCampaignFeatured: (id) => { const item = campaigns.find((campaign) => campaign.id === id); if (item) void updateCampaign(id, { isFeatured: !item.isFeatured }); }, markEmailAsRead: noop, unreadEmailsCount: emails.filter((item) => !item.isRead).length, resetToDemoData: noop,
  }), [roleOverride, currentUserRole, currentTester, currentDeveloper, campaigns, applications, developers, testers, bugReports, feedbacks, emails, securityLogs, isEmailMasked, isLockdownMode, isAntiBotEnabled, isWatermarkEnforced, isTwoFactorEnabled, selectedCampaignSlug, activeTab, toast]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
export const useApp = () => { const context = useContext(AppContext); if (!context) throw new Error('useApp must be used inside AppProvider'); return context; };
