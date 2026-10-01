import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  UserRole,
  TesterStatus,
  AppCampaign,
  DeveloperUser,
  TesterUser,
  TesterApplication,
  BugReport,
  TesterFeedback,
  EmailNotification,
  ReputationLevel,
  SecurityAuditEntry,
} from '../types';
import {
  INITIAL_DEVELOPERS,
  INITIAL_TESTERS,
  INITIAL_CAMPAIGNS,
  INITIAL_APPLICATIONS,
  INITIAL_BUG_REPORTS,
  INITIAL_FEEDBACK,
  INITIAL_EMAILS,
} from '../data/mockData';
import {
  INITIAL_SECURITY_LOGS,
  sanitizeInput,
  validateSecureUrl,
  maskSensitiveEmail,
  isDisposableEmail,
  generateWatermarkToken,
} from '../utils/security';

const isProductionBuild = import.meta.env.PROD;
const readLocalState = (key: string) => isProductionBuild ? null : localStorage.getItem(key);
const writeLocalState = (key: string, value: string) => {
  if (!isProductionBuild) localStorage.setItem(key, value);
};
const removeLocalState = (key: string) => {
  if (!isProductionBuild) localStorage.removeItem(key);
};

interface AppContextType {
  // Roles & Current User
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  currentTester: TesterUser;
  currentDeveloper: DeveloperUser;
  setCurrentTester: (tester: TesterUser) => void;
  setCurrentDeveloper: (dev: DeveloperUser) => void;

  // Data
  campaigns: AppCampaign[];
  applications: TesterApplication[];
  developers: DeveloperUser[];
  testers: TesterUser[];
  bugReports: BugReport[];
  feedbacks: TesterFeedback[];
  emails: EmailNotification[];

  // Security & Compliance Controls
  securityLogs: SecurityAuditEntry[];
  logSecurityEvent: (event: Omit<SecurityAuditEntry, 'id' | 'timestamp'>) => void;
  isEmailMasked: boolean;
  setIsEmailMasked: (masked: boolean) => void;
  isLockdownMode: boolean;
  setIsLockdownMode: (locked: boolean) => void;
  isAntiBotEnabled: boolean;
  setIsAntiBotEnabled: (enabled: boolean) => void;
  isWatermarkEnforced: boolean;
  setIsWatermarkEnforced: (enforced: boolean) => void;
  isTwoFactorEnabled: boolean;
  setIsTwoFactorEnabled: (enabled: boolean) => void;
  clearSecurityLogs: () => void;
  blockSuspiciousIp: (ip: string, reason: string) => void;
  simulateCyberAttackTest: () => void;

  // Navigation state / Active app view
  selectedCampaignSlug: string | null;
  setSelectedCampaignSlug: (slug: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // UI/UX Toast Feedback
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error'; id: number } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  hideToast: () => void;

  // Actions - Tester
  applyToCampaign: (
    campaignId: string,
    formData: {
      name: string;
      email: string;
      googlePlayEmail: string;
      country: string;
      osType: 'android' | 'ios';
      osVersion: string;
      deviceModel: string;
    }
  ) => Promise<{ success: boolean; message: string; applicationId?: string }>;
  toggleTaskCompletion: (applicationId: string, taskId: string) => void;
  submitBugReport: (
    campaignId: string,
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    steps: string,
    deviceInfo: string
  ) => void;
  submitFeedback: (
    campaignId: string,
    rating: number,
    category: 'ui_ux' | 'performance' | 'feature_request' | 'general',
    comment: string,
    taskId?: string
  ) => void;
  confirmTesterJoined: (applicationId: string) => void;
  requestDataDeletion: (email: string) => void;

  // Actions - Developer & Admin
  addCampaign: (campaign: Omit<AppCampaign, 'id' | 'createdAt' | 'currentTestersCount'>) => Promise<string>;
  updateCampaign: (campaignId: string, updates: Partial<AppCampaign>) => Promise<boolean>;
  removeCampaign: (campaignId: string) => Promise<boolean>;
  updateApplicationStatus: (applicationId: string, newStatus: TesterStatus, notes?: string) => void;
  confirmWhitelisted: (applicationId: string) => void;
  confirmBulkWhitelisted: (applicationIds: string[]) => void;
  updateBugStatus: (bugId: string, status: BugReport['status']) => void;
  registerDeveloper: (dev: {
    name: string;
    companyName: string;
    email: string;
    phone?: string;
    bio?: string;
    website?: string;
  }) => void;

  // Actions - Admin
  updateDeveloperStatus: (devId: string, status: DeveloperUser['status']) => void;
  updateTesterStatus: (testerId: string, status: TesterUser['status']) => void;
  updateTesterReputation: (testerId: string, level: ReputationLevel, score: number) => void;
  toggleCampaignFeatured: (campaignId: string) => void;

  // Email notifications
  markEmailAsRead: (emailId: string) => void;
  unreadEmailsCount: number;

  // Reset
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_TESTER: TesterUser = {
  id: 'guest',
  name: 'مستخدم جديد',
  email: '',
  googlePlayGmail: '',
  country: 'المملكة العربية السعودية',
  osPreference: 'android',
  deviceModel: 'هاتف ذكي',
  osVersion: 'Android 14',
  joinedDate: new Date().toISOString().split('T')[0],
  isVerified: false,
  status: 'active',
  activityScore: 50,
  reputation: {
    level: 'new',
    score: 50,
    completedTests: 0,
    commitmentRate: 100,
    helpfulFeedbackCount: 0,
    bugsFoundCount: 0,
    dropoutsCount: 0,
    taskCompletionRate: 100,
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole, roleLoading } = useAuth();

  // Load from localStorage or mock
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    return (readLocalState('testflow_role') as UserRole) || 'tester';
  });

  const [campaigns, setCampaigns] = useState<AppCampaign[]>(() => {
    if (isProductionBuild) return [];
    const saved = readLocalState('testflow_campaigns_real');
    if (!saved) return INITIAL_CAMPAIGNS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      return INITIAL_CAMPAIGNS;
    }
    return INITIAL_CAMPAIGNS;
  });

  const [developers, setDevelopers] = useState<DeveloperUser[]>(() => {
    if (isProductionBuild) return [];
    const saved = readLocalState('testflow_developers');
    return saved ? JSON.parse(saved) : INITIAL_DEVELOPERS;
  });

  const [testers, setTesters] = useState<TesterUser[]>(() => {
    if (isProductionBuild) return [];
    const saved = readLocalState('testflow_testers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback to default testers
      }
    }
    return INITIAL_TESTERS;
  });

  const [applications, setApplications] = useState<TesterApplication[]>(() => {
    if (isProductionBuild) return [];
    const saved = readLocalState('testflow_applications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback to default applications
      }
    }
    return INITIAL_APPLICATIONS;
  });

  const [bugReports, setBugReports] = useState<BugReport[]>(() => {
    if (isProductionBuild) return [];
    const saved = readLocalState('testflow_bugs');
    if (saved && (saved.includes('عبدالله') || saved.includes('tester-1'))) {
      removeLocalState('testflow_bugs');
      return [];
    }
    return saved ? JSON.parse(saved) : [];
  });

  const [feedbacks, setFeedbacks] = useState<TesterFeedback[]>(() => {
    if (isProductionBuild) return [];
    const saved = readLocalState('testflow_feedbacks');
    if (saved && (saved.includes('عبدالله') || saved.includes('tester-1'))) {
      removeLocalState('testflow_feedbacks');
      return [];
    }
    return saved ? JSON.parse(saved) : [];
  });

  const [emails, setEmails] = useState<EmailNotification[]>(() => {
    if (isProductionBuild) return [];
    const saved = readLocalState('testflow_emails');
    if (saved && (saved.includes('عبدالله') || saved.includes('abood2001.abood'))) {
      removeLocalState('testflow_emails');
      return [];
    }
    return saved ? JSON.parse(saved) : [];
  });

  // Security Audit Logs & Privacy Controls
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditEntry[]>(() => {
    if (isProductionBuild) return [];
    const saved = readLocalState('testflow_security_logs');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_LOGS;
  });

  const [isEmailMasked, setIsEmailMasked] = useState<boolean>(() => {
    const saved = readLocalState('testflow_mask_emails');
    return saved !== null ? JSON.parse(saved) : true; // Enabled by default for privacy compliance
  });

  const [isLockdownMode, setIsLockdownModeState] = useState<boolean>(() => {
    const saved = readLocalState('testflow_sec_lockdown');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [isAntiBotEnabled, setIsAntiBotEnabled] = useState<boolean>(() => {
    const saved = readLocalState('testflow_sec_antibot');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isWatermarkEnforced, setIsWatermarkEnforced] = useState<boolean>(() => {
    const saved = readLocalState('testflow_sec_watermark');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState<boolean>(() => {
    const saved = readLocalState('testflow_sec_2fa');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Active user profiles - dynamically generated from authenticated user
  const [currentTester, setCurrentTester] = useState<TesterUser>(DEFAULT_TESTER);
  const [currentDeveloper, setCurrentDeveloper] = useState<DeveloperUser>(developers[0] || {
    id: 'dev-1',
    name: 'مطور',
    companyName: 'فريق التطوير',
    email: '',
    status: 'approved',
    submittedAt: new Date().toISOString().split('T')[0],
    appsCount: 1,
  });

  // Sync tester with authenticated Google account
  useEffect(() => {
    if (user) {
      setCurrentTester({
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'مختبر',
        email: user.email || '',
        googlePlayGmail: user.email || '',
        avatarUrl: user.photoURL || undefined,
        country: 'المملكة العربية السعودية',
        osPreference: 'android',
        deviceModel: 'هاتف ذكي',
        osVersion: 'Android 14',
        joinedDate: new Date().toISOString().split('T')[0],
        isVerified: true,
        status: 'active',
        activityScore: 50,
        reputation: {
          level: 'new',
          score: 50,
          completedTests: 0,
          commitmentRate: 100,
          helpfulFeedbackCount: 0,
          bugsFoundCount: 0,
          dropoutsCount: 0,
          taskCompletionRate: 100,
        },
      });
    } else {
      setCurrentTester(DEFAULT_TESTER);
    }
  }, [user]);

  // View state
  const [selectedCampaignSlug, setSelectedCampaignSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');

  // UI/UX Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    id: number;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  };

  const hideToast = () => setToast(null);

  // Sync to localStorage
  useEffect(() => {
    writeLocalState('testflow_role', currentUserRole);
  }, [currentUserRole]);

  useEffect(() => {
    writeLocalState('testflow_campaigns_real', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    writeLocalState('testflow_developers', JSON.stringify(developers));
  }, [developers]);

  useEffect(() => {
    writeLocalState('testflow_testers', JSON.stringify(testers));
  }, [testers]);

  useEffect(() => {
    writeLocalState('testflow_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    writeLocalState('testflow_bugs', JSON.stringify(bugReports));
  }, [bugReports]);

  useEffect(() => {
    writeLocalState('testflow_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    writeLocalState('testflow_emails', JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    writeLocalState('testflow_security_logs', JSON.stringify(securityLogs));
  }, [securityLogs]);

  useEffect(() => {
    writeLocalState('testflow_mask_emails', JSON.stringify(isEmailMasked));
  }, [isEmailMasked]);

  // Load public data publicly and private workspace data only through role-scoped endpoints.
  useEffect(() => {
    if (user && roleLoading) return;

    const isPrivateRole = userRole === 'admin' || userRole === 'developer';
    if (isPrivateRole) {
      setCampaigns([]);
      setApplications([]);
    }

    const campaignPath = userRole === 'admin'
      ? '/api/admin/campaigns'
      : userRole === 'developer'
        ? '/api/developer/campaigns'
        : '/api/campaigns';
    const campaignRequest = user && isPrivateRole
      ? user.getIdToken().then((token) => fetch(campaignPath, {
          headers: { Authorization: `Bearer ${token}` },
        }))
      : fetch(campaignPath);

    campaignRequest
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && (data.length > 0 || isPrivateRole)) {
          setCampaigns(
            data.map((d: any) => ({
              id: d.id,
              slug: d.slug,
              name: d.name,
              tagline: d.shortDescription || d.tagline || '',
              description: d.fullDescription || d.description || '',
              iconUrl: d.icon || d.iconUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80',
              screenshots: d.bannerImage ? [d.bannerImage] : (d.screenshots || []),
              developerId: d.developerId,
              developerName: d.developerName,
              platform: d.platform as any,
              testType: 'google_play_closed',
              testUrl: d.testUrl,
              version: d.version || '1.0.0',
              durationDays: d.minTestingDays || d.durationDays || 14,
              requiredTestersCount: d.requiredTestersCount || 20,
              currentTestersCount: d.currentTestersCount || 0,
              targetCountries: d.targetCountries || ['جميع الدول العربية'],
              targetDevices: d.targetDevices || ['جميع الأجهزة'],
              minOsVersion: d.minOsVersion || 'Android 10+',
              testingInstructions: d.instructions || d.testingInstructions || '',
              category: d.category as any,
              startDate: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: d.status as any,
              tasks: d.tasks || [],
              createdAt: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              isFeatured: Boolean(d.isFeatured),
            }))
          );
        }
      })
      .catch((err) => console.warn('Could not sync campaigns from Cloud SQL:', err));

    if (user) {
      const applicationsPath = userRole === 'admin'
        ? '/api/admin/applications'
        : userRole === 'developer'
          ? '/api/developer/applications'
          : '/api/applications';
      user.getIdToken()
        .then((token) => fetch(applicationsPath, {
          headers: { Authorization: `Bearer ${token}` },
        }))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            setApplications(data.map((d: any) => {
              const matchedCamp = campaigns.find((c) => c.id === d.campaignId);
              return {
                id: d.id,
                campaignId: d.campaignId,
                appName: matchedCamp?.name || d.appName || 'تطبيق للاختبار',
                appIcon: matchedCamp?.iconUrl || d.appIcon || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80',
                platform: d.osType === 'ios' ? 'ios' : 'android',
                testerId: d.testerId,
                testerName: d.testerName,
                testerEmail: d.testerEmail,
                googlePlayEmail: d.googlePlayEmail || d.testerEmail,
                testerCountry: d.country || '',
                deviceModel: d.deviceModel || '',
                osType: d.osType as any,
                osVersion: d.osVersion || '',
                status: d.status as any,
                appliedAt: d.appliedAt ? new Date(d.appliedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                currentDay: d.completedDays || d.currentDay || 0,
                completedTaskIds: d.completedTaskIds || [],
                activityScore: 50,
                lastActiveDate: new Date().toISOString().split('T')[0],
              };
            }));
          } else if (isPrivateRole) {
            setApplications([]);
          }
        })
        .catch((err) => {
          if (isPrivateRole) setApplications([]);
          console.warn('Could not sync scoped applications:', err);
        });
    } else {
      setApplications([]);
    }
  }, [roleLoading, user, userRole]);

  // Log Security Event
  const logSecurityEvent = (event: Omit<SecurityAuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: SecurityAuditEntry = {
      ...event,
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setSecurityLogs((prev) => [newEntry, ...prev]);
  };

  const setIsLockdownMode = (locked: boolean) => {
    setIsLockdownModeState(locked);
    writeLocalState('testflow_sec_lockdown', JSON.stringify(locked));
    logSecurityEvent({
      actor: 'مسؤول الأمن السيبراني (CISO)',
      actorRole: currentUserRole,
      eventType: locked ? 'emergency_lockdown_enabled' : 'emergency_lockdown_disabled',
      status: locked ? 'BLOCKED' : 'ALLOWED',
      details: locked
        ? '⚠️ تم تفعيل وضع الطوارئ وتجميد الروابط (Lockdown Mode): تم إيقاف جميع روابط التنزيل فوراً لحماية النسخة التجريبية من التسريب.'
        : '✅ تم إنهاء وضع الطوارئ واستئناف عمل الروابط المشفرة للمختبرين المعتمدين.',
      ipAddress: '10.0.0.1 (SecOps Command)',
      severity: locked ? 'critical' : 'low',
    });
  };

  const clearSecurityLogs = () => {
    setSecurityLogs([]);
    removeLocalState('testflow_security_logs');
  };

  const blockSuspiciousIp = (ip: string, reason: string) => {
    logSecurityEvent({
      actor: 'نظام الاستجابة التلقائي (Active IPS)',
      actorRole: 'admin',
      eventType: 'ip_blocked',
      status: 'BLOCKED',
      details: `تم حظر عنوان الـ IP (${ip}) للاشتباه في نشاط هجومي أو روبوت فحص: ${reason}.`,
      ipAddress: ip,
      severity: 'critical',
    });
  };

  const simulateCyberAttackTest = () => {
    logSecurityEvent({
      actor: 'مهاجم مجهول (Threat Actor / Scanner)',
      actorRole: 'guest',
      eventType: 'xss_sanitized',
      status: 'BLOCKED',
      details: 'تم رصد واعتراض محاولة حقن XSS & SQLi <script>alert(1)</script> على حقول إرسال البلاغات وحجبها بنجاح.',
      ipAddress: '198.51.100.22 (Tor Proxy Node)',
      severity: 'high',
    });
  };

  // Recalculate reputation for a tester dynamically
  const recalculateTesterReputation = (testerId: string) => {
    setTesters((prevTesters) =>
      prevTesters.map((t) => {
        if (t.id !== testerId) return t;
        const myApps = applications.filter((a) => a.testerId === testerId);
        const completedTests = myApps.filter((a) => a.status === 'completed').length;
        const myBugs = bugReports.filter((b) => b.testerId === testerId).length;
        const myFeedback = feedbacks.filter((f) => f.testerId === testerId).length;

        let totalTasksRequired = 0;
        let totalTasksDone = 0;
        myApps.forEach((app) => {
          const camp = campaigns.find((c) => c.id === app.campaignId);
          if (camp) {
            totalTasksRequired += camp.tasks.length;
            totalTasksDone += app.completedTaskIds.length;
          }
        });

        const taskCompletionRate =
          totalTasksRequired > 0 ? Math.round((totalTasksDone / totalTasksRequired) * 100) : 100;

        let score = 50 + completedTests * 10 + myFeedback * 3 + myBugs * 4;
        if (score > 100) score = 100;

        let level: ReputationLevel = 'new';
        if (score >= 90 && completedTests >= 3) level = 'top';
        else if (score >= 75) level = 'trusted';
        else if (score >= 60) level = 'active';

        return {
          ...t,
          activityScore: score,
          reputation: {
            ...t.reputation,
            score,
            level,
            completedTests,
            bugsFoundCount: myBugs,
            helpfulFeedbackCount: myFeedback,
            taskCompletionRate,
          },
        };
      })
    );
  };

  // Helper to send simulated email notification
  const sendEmail = (email: Omit<EmailNotification, 'id' | 'sentAt' | 'isRead'>) => {
    const newEmail: EmailNotification = {
      ...email,
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
    };
    setEmails((prev) => [newEmail, ...prev]);
  };

  // Tester applies to an app campaign
  const applyToCampaign = async (
    campaignId: string,
    formData: {
      name: string;
      email: string;
      googlePlayEmail: string;
      country: string;
      osType: 'android' | 'ios';
      osVersion: string;
      deviceModel: string;
    }
  ): Promise<{ success: boolean; message: string; applicationId?: string }> => {
    const camp = campaigns.find((c) => c.id === campaignId);
    if (!camp) return { success: false, message: 'التطبيق غير موجود' };

    const cleanName = sanitizeInput(formData.name || currentTester.name);
    const cleanEmail = sanitizeInput(formData.email || currentTester.email);
    const cleanPlayEmail = sanitizeInput(formData.googlePlayEmail || formData.email || currentTester.googlePlayGmail || '');
    const cleanCountry = sanitizeInput(formData.country || currentTester.country);
    const cleanModel = sanitizeInput(formData.deviceModel || currentTester.deviceModel);
    const cleanOsVersion = sanitizeInput(formData.osVersion);

    // Anti-bot & disposable email protection check
    if (isAntiBotEnabled && (isDisposableEmail(cleanEmail) || isDisposableEmail(cleanPlayEmail))) {
      logSecurityEvent({
        actor: cleanName || 'مستخدم مجهول (Bot Suspect)',
        actorRole: 'tester',
        eventType: 'disposable_email_blocked',
        status: 'BLOCKED',
        details: `تم حجب محاولة تسجيل عبر بريد مؤقت (${cleanEmail}) لاجتياز اختبار ${camp.name} لمدة 14 يوماً.`,
        ipAddress: '185.220.***.*** (خدمة إيميل مؤقت)',
        severity: 'high',
      });
      return {
        success: false,
        message: '🛡️ تنبيه الحماية: تم رفض البريد المؤقت (Disposable Email). يتطلب اختبار Google Play Closed Testing إيميل حقيقي دائم لضمان استمرار الاختبار لمدة 14 يوماً متواصلة.',
      };
    }

    // Check if already applied
    const existing = applications.find(
      (a) =>
        a.campaignId === campaignId &&
        ((Boolean(cleanEmail) && a.testerEmail.toLowerCase() === cleanEmail.toLowerCase()) ||
          (currentTester.id !== 'guest' && a.testerId === currentTester.id))
    );
    if (existing) {
      return { success: false, message: 'لقد قمت بالتقديم على هذا التطبيق مسبقاً!' };
    }

    // Default status:
    // If closed testing on google play, goes to 'waiting_for_whitelisting' after developer accepts
    const newApp: TesterApplication = {
      id: `app-${Date.now()}`,
      campaignId: camp.id,
      appName: camp.name,
      appIcon: camp.iconUrl,
      platform: camp.platform,
      testerId:
        currentTester.id === 'guest'
          ? `anonymous-${globalThis.crypto?.randomUUID?.() || Date.now()}`
          : currentTester.id,
      testerName: cleanName,
      testerEmail: cleanEmail,
      googlePlayEmail: cleanPlayEmail,
      testerCountry: cleanCountry,
      deviceModel: cleanModel,
      osType: formData.osType,
      osVersion: cleanOsVersion,
      status: 'pending', // Starts pending developer review
      appliedAt: new Date().toISOString().split('T')[0],
      currentDay: 0,
      completedTaskIds: [],
      activityScore: 50,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };

    let persistedApplication: { id: string; testerId: string };
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: newApp.campaignId,
          testerName: newApp.testerName,
          testerEmail: newApp.testerEmail,
          googlePlayEmail: newApp.googlePlayEmail,
          country: newApp.testerCountry,
          osType: newApp.osType,
          osVersion: newApp.osVersion,
          deviceModel: newApp.deviceModel,
        }),
      });
      if (!response.ok) {
        throw new Error(response.status === 503
          ? 'تعذر حفظ الطلب الآن. تحقق من اتصال الخدمة ثم أعد المحاولة.'
          : 'تعذر إرسال الطلب. راجع البيانات وحاول مرة أخرى.');
      }
      persistedApplication = await response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'تعذر حفظ الطلب. حاول مرة أخرى.',
      };
    }

    const savedApplication = {
      ...newApp,
      id: persistedApplication.id,
      testerId: persistedApplication.testerId,
    };
    setApplications((prev) => [savedApplication, ...prev]);

    // Send confirmation email
    sendEmail({
      toEmail: savedApplication.testerEmail,
      toName: savedApplication.testerName,
      subject: `📋 تم استلام طلبك للانضمام لاختبار "${camp.name}"`,
      previewText: `طلبك قيد المراجعة حالياً من قبل مطور التطبيق (${camp.developerName}).`,
      body: `مرحباً ${savedApplication.testerName}،\n\nنشكرك على رغبتك في اختبار تطبيق "${camp.name}". تم استلام طلبك بنجاح وهو قيد المراجعة. ستصلك الخطوة التالية عند الموافقة؛ رابط الاختبار لا يظهر قبل اعتماد جاهزية الانضمام.\n\nفريق TestFlow`,
      type: 'accepted',
    });

    return { success: true, message: 'تم استلام طلبك بنجاح.', applicationId: savedApplication.id };
  };

  // Toggle daily task
  const toggleTaskCompletion = (applicationId: string, taskId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        const exists = app.completedTaskIds.includes(taskId);
        const newIds = exists
          ? app.completedTaskIds.filter((id) => id !== taskId)
          : [...app.completedTaskIds, taskId];

        const newScore = Math.min(100, Math.max(30, app.activityScore + (exists ? -10 : 15)));

        return {
          ...app,
          completedTaskIds: newIds,
          activityScore: newScore,
          lastActiveDate: new Date().toISOString().split('T')[0],
          status: app.status === 'ready_to_join' ? 'active' : app.status,
        };
      })
    );

    // Update reputation
    recalculateTesterReputation(currentTester.id);
  };

  // Confirm tester has joined and started testing
  const confirmTesterJoined = (applicationId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          status: 'active',
          joinedAt: new Date().toISOString().split('T')[0],
          currentDay: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          activityScore: Math.min(100, app.activityScore + 20),
        };
      })
    );
  };

  // Submit bug report
  const submitBugReport = (
    campaignId: string,
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    steps: string,
    deviceInfo: string
  ) => {
    const rawInput = `${title} ${description} ${steps}`;
    const containsPotentialAttack = /<script|javascript:|onerror=|onload=/i.test(rawInput);
    if (containsPotentialAttack) {
      logSecurityEvent({
        actor: currentTester.name,
        actorRole: currentUserRole,
        eventType: 'xss_sanitized',
        status: 'BLOCKED',
        details: 'تم اكتشاف مدخلات خبيثة محتملة في بلاغ الخلل وتم تنقيتها تلقائياً بواسطة WAF.',
        ipAddress: '192.168.1.*** (عميل محلي)',
        severity: 'high',
      });
    }

    const camp = campaigns.find((c) => c.id === campaignId);
    const newBug: BugReport = {
      id: `bug-${Date.now()}`,
      campaignId,
      appName: camp ? camp.name : 'تطبيق',
      testerId: currentTester.id,
      testerName: sanitizeInput(currentTester.name),
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      severity,
      stepsToReproduce: sanitizeInput(steps),
      deviceInfo: sanitizeInput(deviceInfo),
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setBugReports((prev) => [newBug, ...prev]);

    // Boost tester activity score
    setApplications((prev) =>
      prev.map((app) => {
        if (app.campaignId === campaignId && app.testerId === currentTester.id) {
          return {
            ...app,
            activityScore: Math.min(100, app.activityScore + 15),
            lastActiveDate: new Date().toISOString().split('T')[0],
          };
        }
        return app;
      })
    );

    recalculateTesterReputation(currentTester.id);
  };

  // Submit feedback
  const submitFeedback = (
    campaignId: string,
    rating: number,
    category: 'ui_ux' | 'performance' | 'feature_request' | 'general',
    comment: string,
    taskId?: string
  ) => {
    const camp = campaigns.find((c) => c.id === campaignId);
    const newFb: TesterFeedback = {
      id: `fb-${Date.now()}`,
      campaignId,
      appName: camp ? camp.name : 'تطبيق',
      testerId: currentTester.id,
      testerName: sanitizeInput(currentTester.name),
      rating,
      category,
      comment: sanitizeInput(comment),
      taskId,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isHelpful: true,
    };

    setFeedbacks((prev) => [newFb, ...prev]);

    // Boost activity score
    setApplications((prev) =>
      prev.map((app) => {
        if (app.campaignId === campaignId && app.testerId === currentTester.id) {
          return {
            ...app,
            activityScore: Math.min(100, app.activityScore + 10),
            lastActiveDate: new Date().toISOString().split('T')[0],
          };
        }
        return app;
      })
    );

    recalculateTesterReputation(currentTester.id);
  };

  // Privacy: Request data deletion
  const requestDataDeletion = (email: string) => {
    logSecurityEvent({
      actor: email,
      actorRole: 'tester',
      eventType: 'data_deletion_requested',
      status: 'FLAGGED',
      details: `تم تسجيل طلب حق النسيان لمحو كافة البيانات الشخصية وسجل الاختبارات للبريد (${maskSensitiveEmail(email)}).`,
      ipAddress: '10.0.4.*** (GDPR/PDPL Endpoint)',
      severity: 'medium',
    });

    sendEmail({
      toEmail: email,
      toName: 'المستخدم',
      subject: '🔒 تأكيد استلام طلب حذف الحساب والبيانات',
      previewText: 'تم تسجيل طلبك لحذف جميع البيانات الشخصية وسجل الاختبارات.',
      body: `مرحباً،\n\nتأكيداً لحرص منصة TestFlow على خصوصيتك وفق أعلى معايير حماية البيانات:\nتم استقبال طلب حذف حسابك المرتبط بالبريد (${email}). سيتم حذف جميع بيانات جهازك وسجلاتك نهائياً خلال 48 ساعة.\n\nشكراً لك،\nفريق الخصوصية والأمن السيبراني في TestFlow`,
      type: 'inactivity_warning',
    });
  };

  // Developer or Admin adds new campaign
  const addCampaign = async (campData: Omit<AppCampaign, 'id' | 'createdAt' | 'currentTestersCount'>) => {
    if (!user) throw new Error('يلزم تسجيل الدخول بحساب مطور معتمد.');
    const newId = `camp-${Date.now()}`;
    const newCamp: AppCampaign = {
      ...campData,
      id: newId,
      currentTestersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: newCamp.id,
          name: newCamp.name,
          appName: newCamp.name,
          slug: newCamp.slug,
          developerName: newCamp.developerName,
          platform: newCamp.platform,
          category: newCamp.category,
          shortDescription: newCamp.tagline,
          fullDescription: newCamp.description,
          icon: newCamp.iconUrl,
          bannerImage: newCamp.screenshots?.[0] || null,
          testUrl: newCamp.testUrl,
          requiredTestersCount: newCamp.requiredTestersCount || 20,
          currentTestersCount: 0,
          minTestingDays: newCamp.durationDays || 14,
          rewardDescription: newCamp.reward?.title || null,
          reward: newCamp.reward || undefined,
          status: newCamp.status || 'active',
          isFeatured: Boolean(newCamp.isFeatured),
          instructions: newCamp.testingInstructions,
          ndaRequired: false,
        }),
      });
      if (!response.ok) throw new Error('تعذر حفظ الحملة في قاعدة البيانات. تحقق من الاتصال وحاول مجددًا.');
      setCampaigns((prev) => [newCamp, ...prev]);
      setDevelopers((prev) => prev.map((dev) => (
        dev.id === campData.developerId ? { ...dev, appsCount: dev.appsCount + 1 } : dev
      )));
      showToast(`تم إضافة التطبيق "${newCamp.name}" بنجاح!`, 'success');
      return newId;
    } catch (error) {
      throw error instanceof Error ? error : new Error('تعذر حفظ الحملة في قاعدة البيانات.');
    }
  };

  const updateCampaign = async (campaignId: string, updates: Partial<AppCampaign>) => {
    if (!user) return false;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Campaign update failed.');
      setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, ...updates } : c)));
      return true;
    } catch {
      showToast('تعذر حفظ التغييرات في قاعدة البيانات. حاول مرة أخرى.', 'error');
      return false;
    }
  };

  const removeCampaign = async (campaignId: string) => {
    if (!user) return false;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Campaign deletion failed.');
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      setApplications((prev) => prev.filter((a) => a.campaignId !== campaignId));
      setBugReports((prev) => prev.filter((b) => b.campaignId !== campaignId));
      setFeedbacks((prev) => prev.filter((f) => f.campaignId !== campaignId));
      showToast('تمت إزالة التطبيق بنجاح', 'info');
      return true;
    } catch {
      showToast('تعذر حذف الحملة من قاعدة البيانات. حاول مرة أخرى.', 'error');
      return false;
    }
  };

  // Developer updates tester status
  const updateApplicationStatus = (applicationId: string, newStatus: TesterStatus, notes?: string) => {
    let targetApp: TesterApplication | undefined;

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        targetApp = { ...app, status: newStatus, developerNotes: notes || app.developerNotes };
        return targetApp;
      })
    );

    if (user) {
      user.getIdToken().then((token) => fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, notes }),
      })).catch((err) => console.warn('Application status update failed:', err));
    }

    if (targetApp) {
      const camp = campaigns.find((c) => c.id === targetApp?.campaignId);
      // Dispatch relevant notification
      if (newStatus === 'accepted') {
        sendEmail({
          toEmail: targetApp.testerEmail,
          toName: targetApp.testerName,
          subject: `✅ تمت الموافقة على طلبك لاختبار "${camp?.name}"`,
          previewText: 'وافق المطور على انضمامك، وتجري إضافة بريدك للقائمة المغلقة.',
          body: `مرحباً ${targetApp.testerName}،\n\nيسعدنا إخبارك بقبول طلبك لاختبار "${camp?.name}".\n\nالحالة الحالية: "في انتظار الإضافة للقائمة البيضاء (Waiting for Whitelisting)".\nبمجرد أن يُنهي المطور إضافة بريدك في Google Play Console أو TestFlight، سيظهر لك رابط التنزيل فوراً.\n\nشكراً لتعاونك!`,
          type: 'accepted',
        });
      } else if (newStatus === 'waiting_for_whitelisting') {
        sendEmail({
          toEmail: targetApp.testerEmail,
          toName: targetApp.testerName,
          subject: `⏳ بريدك قيد الإضافة في متجر التطبيقات لـ "${camp?.name}"`,
          previewText: 'يقوم المطور حالياً بإضافة بريدك إلى Google Play Console.',
          body: `مرحباً ${targetApp.testerName}،\n\nبريدك (${targetApp.googlePlayEmail}) أُدرج في قائمة الإضافة للمتجر. سيظهر لك الرابط عند اعتماد الجاهزية.\n\nفريق TestFlow`,
          type: 'accepted',
        });
      } else if (newStatus === 'ready_to_join') {
        sendEmail({
          toEmail: targetApp.testerEmail,
          toName: targetApp.testerName,
          subject: `🚀 أصبح رابط تطبيق "${camp?.name}" متاحاً الآن في حسابك!`,
          previewText: 'تمت إضافة بريدك بنجاح! افتح حسابك واضغط على زر التحميل.',
          body: `مرحباً ${targetApp.testerName}،\n\nأكد المطور إضافة بريدك (${targetApp.googlePlayEmail}) لقائمة المختبرين.\n\nرابط الاختبار المغلق أصبح نشطاً الآن في حسابك:\n${camp?.testUrl || 'رابط المتجر'}\n\nيرجى التثبيت والبدء باليوم الأول لاحتساب النقاط.\n\nبالتوفيق!`,
          type: 'whitelisted_ready',
        });
      } else if (newStatus === 'completed') {
        sendEmail({
          toEmail: targetApp.testerEmail,
          toName: targetApp.testerName,
          subject: `🏆 تهانينا! أكملت فترة الاختبار بنجاح لتطبيق "${camp?.name}"`,
          previewText: 'لقد أكملت فترة الاختبار بنجاح واستحققت المكافأة المقررة!',
          body: `مرحباً ${targetApp.testerName}،\n\nألف مبروك! أكملت بنجاح مدة الاختبار المطلوبة لتطبيق "${camp?.name}".\n\nمكافأتك: ${camp?.reward?.title || 'شارة مختبر متميز'}\nتم تحديث تقييمك في المنصة وارتفعت رتبتك لمستوى أعلى! ⭐\n\nشكراً لمساهمتك القيمة في تحسين البرمجيات العربية.`,
          type: 'completed',
        });
      }
    }
  };

  // ONE-CLICK WHITELISTING CONFIRMATION: The core workflow of Google Play Closed Testing
  const confirmWhitelisted = (applicationId: string) => {
    updateApplicationStatus(applicationId, 'ready_to_join');
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: 'ready_to_join',
              whitelistedAt: new Date().toISOString().split('T')[0],
            }
          : app
      )
    );

    const appObj = applications.find((a) => a.id === applicationId);
    logSecurityEvent({
      actor: currentDeveloper.companyName,
      actorRole: currentUserRole,
      eventType: 'tester_whitelisted',
      status: 'ALLOWED',
      details: `تم اعتماد المختبر (${appObj?.testerName || 'مختبر'}) وإتاحة رابط الاختبار المغلق له بعد الإضافة في Google Play Console.`,
      ipAddress: '176.224.***.***',
      severity: 'low',
    });
  };

  // Bulk whitelisting confirmation
  const confirmBulkWhitelisted = (applicationIds: string[]) => {
    logSecurityEvent({
      actor: currentDeveloper.companyName,
      actorRole: currentUserRole,
      eventType: 'bulk_email_export',
      status: 'ALLOWED',
      details: `تم اعتماد وتفعيل حالة Ready to Join لـ (${applicationIds.length}) مختبرين دفعة واحدة.`,
      ipAddress: '176.224.***.***',
      severity: 'medium',
    });
    applicationIds.forEach((id) => confirmWhitelisted(id));
  };

  const updateBugStatus = (bugId: string, status: BugReport['status']) => {
    setBugReports((prev) => prev.map((b) => (b.id === bugId ? { ...b, status } : b)));
  };

  const registerDeveloper = (dev: {
    name: string;
    companyName: string;
    email: string;
    phone?: string;
    bio?: string;
    website?: string;
  }) => {
    const newDev: DeveloperUser = {
      id: `dev-${Date.now()}`,
      name: dev.name,
      companyName: dev.companyName,
      email: dev.email,
      phone: dev.phone,
      bio: dev.bio,
      website: dev.website,
      status: 'pending_approval',
      submittedAt: new Date().toISOString().split('T')[0],
      appsCount: 0,
    };

    setDevelopers((prev) => [newDev, ...prev]);
    setCurrentDeveloper(newDev);

    // Notify developer
    sendEmail({
      toEmail: dev.email,
      toName: dev.name,
      subject: '🏢 تم استلام طلب تسجيل حساب المطور في TestFlow',
      previewText: 'طلبك قيد المراجعة والاعتماد من قبل إدارة المنصة.',
      body: `مرحباً ${dev.name}،\n\nيسعدنا اهتمامك بالانضمام إلى TestFlow لإدارة مختبري تطبيقاتك قبل النشر على المتاجر.\nتم تسجيل طلبك وهو قيد التدقيق من قبل الإدارة لضمان معايير الجودة والموثوقية. سنوافيك بالتفعيل قريباً.\n\nفريق إدارة TestFlow`,
      type: 'developer_approved',
    });
  };

  // Admin actions
  const updateDeveloperStatus = (devId: string, status: DeveloperUser['status']) => {
    setDevelopers((prev) =>
      prev.map((d) => {
        if (d.id !== devId) return d;
        const updated = {
          ...d,
          status,
          approvedAt: status === 'approved' ? new Date().toISOString().split('T')[0] : d.approvedAt,
        };

        if (status === 'approved') {
          logSecurityEvent({
            actor: 'إدارة TestFlow (Admin)',
            actorRole: 'admin',
            eventType: 'developer_approved',
            status: 'ALLOWED',
            details: `تمت الموافقة الرسمية على ترخيص حساب المطور (${d.companyName}) لإنشاء حملات الاختبار.`,
            ipAddress: '10.0.0.1 (SecOps Admin)',
            severity: 'low',
          });

          sendEmail({
            toEmail: d.email,
            toName: d.name,
            subject: '🎉 تمت الموافقة على حساب المطور الخاص بك في TestFlow!',
            previewText: 'يمكنك الآن الدخول إلى لوحة التحكم وإضافة تطبيقاتك وحملاتك.',
            body: `مرحباً ${d.name}،\n\nيسر إدارة TestFlow إعلامك بأنه تمت الموافقة على حسابك كمطور معتمد.\nيمكنك الآن تسجيل الدخول وإضافة أول تطبيق وحملة اختبار، وجمع مختبرين حقيقيين لتجاوز شروط Google Play بنجاح.\n\nتمنياتنا لك بالتوفيق!`,
            type: 'developer_approved',
          });
        } else if (status === 'suspended') {
          logSecurityEvent({
            actor: 'إدارة TestFlow (Admin)',
            actorRole: 'admin',
            eventType: 'developer_suspended',
            status: 'BLOCKED',
            details: `تم حظر وإيقاف حساب المطور (${d.companyName}) وتجميد حملاته فوراً للاشتباه أو انتهاك السياسات.`,
            ipAddress: '10.0.0.1 (SecOps Admin)',
            severity: 'high',
          });
        }

        return updated;
      })
    );
  };

  const updateTesterStatus = (testerId: string, status: TesterUser['status']) => {
    setTesters((prev) => prev.map((t) => (t.id === testerId ? { ...t, status } : t)));
  };

  const updateTesterReputation = (testerId: string, level: ReputationLevel, score: number) => {
    setTesters((prev) =>
      prev.map((t) =>
        t.id === testerId
          ? {
              ...t,
              reputation: { ...t.reputation, level, score },
            }
          : t
      )
    );
  };

  const toggleCampaignFeatured = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, isFeatured: !c.isFeatured } : c))
    );
  };

  const markEmailAsRead = (emailId: string) => {
    setEmails((prev) => prev.map((e) => (e.id === emailId ? { ...e, isRead: true } : e)));
  };

  const unreadEmailsCount = emails.filter((e) => !e.isRead).length;

  const resetToDemoData = () => {
    removeLocalState('testflow_role');
    removeLocalState('testflow_campaigns');
    removeLocalState('testflow_developers');
    removeLocalState('testflow_testers');
    removeLocalState('testflow_applications');
    removeLocalState('testflow_bugs');
    removeLocalState('testflow_feedbacks');
    removeLocalState('testflow_emails');

    setCampaigns(isProductionBuild ? [] : INITIAL_CAMPAIGNS);
    setDevelopers(isProductionBuild ? [] : INITIAL_DEVELOPERS);
    setTesters(isProductionBuild ? [] : INITIAL_TESTERS);
    setApplications(isProductionBuild ? [] : INITIAL_APPLICATIONS);
    setBugReports(isProductionBuild ? [] : INITIAL_BUG_REPORTS);
    setFeedbacks(isProductionBuild ? [] : INITIAL_FEEDBACK);
    setEmails(isProductionBuild ? [] : INITIAL_EMAILS);
    setCurrentUserRole('tester');
    setCurrentTester(INITIAL_TESTERS[0]);
    setCurrentDeveloper(INITIAL_DEVELOPERS[0]);
    setSelectedCampaignSlug(null);
    setActiveTab('home');
  };

  return (
    <AppContext.Provider
      value={{
        currentUserRole,
        setCurrentUserRole,
        currentTester,
        currentDeveloper,
        setCurrentTester,
        setCurrentDeveloper,
        campaigns,
        applications,
        developers,
        testers,
        bugReports,
        feedbacks,
        emails,
        securityLogs,
        logSecurityEvent,
        isEmailMasked,
        setIsEmailMasked,
        isLockdownMode,
        setIsLockdownMode,
        isAntiBotEnabled,
        setIsAntiBotEnabled,
        isWatermarkEnforced,
        setIsWatermarkEnforced,
        isTwoFactorEnabled,
        setIsTwoFactorEnabled,
        clearSecurityLogs,
        blockSuspiciousIp,
        simulateCyberAttackTest,
        selectedCampaignSlug,
        setSelectedCampaignSlug,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        hideToast,
        applyToCampaign,
        toggleTaskCompletion,
        submitBugReport,
        submitFeedback,
        confirmTesterJoined,
        requestDataDeletion,
        addCampaign,
        updateCampaign,
        removeCampaign,
        updateApplicationStatus,
        confirmWhitelisted,
        confirmBulkWhitelisted,
        updateBugStatus,
        registerDeveloper,
        updateDeveloperStatus,
        updateTesterStatus,
        updateTesterReputation,
        toggleCampaignFeatured,
        markEmailAsRead,
        unreadEmailsCount,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
