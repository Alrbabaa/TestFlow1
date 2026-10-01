export type UserRole = 'tester' | 'developer' | 'admin' | 'guest';

export type TesterStatus =
  | 'pending'                  // قيد المراجعة
  | 'accepted'                 // تم القبول
  | 'waiting_for_whitelisting' // بانتظار إضافة البريد لقائمة Google Play Console
  | 'ready_to_join'            // جاهز للانضمام (تمت الإضافة ويظهر الرابط)
  | 'joined'                   // تم الانضمام
  | 'active'                   // نشط (يتابع الاختبار يومياً)
  | 'completed'                // أكمل فترة الاختبار بنجاح (14/20 يوم)
  | 'inactive'                 // غير نشط (توقف عن الاستخدام)
  | 'rejected';                // مرفوض

export type ReputationLevel = 'new' | 'active' | 'trusted' | 'top';

export interface TesterReputation {
  level: ReputationLevel;
  score: number; // 0 - 100
  completedTests: number;
  commitmentRate: number; // %
  helpfulFeedbackCount: number;
  bugsFoundCount: number;
  dropoutsCount: number;
  taskCompletionRate: number; // %
}

export interface TesterUser {
  id: string;
  name: string;
  email: string;
  googlePlayGmail?: string;
  appleId?: string;
  country: string;
  osPreference: 'android' | 'ios' | 'both';
  deviceModel: string;
  osVersion: string;
  reputation: TesterReputation;
  joinedDate: string;
  avatarUrl?: string;
  isVerified: boolean;
  status: 'active' | 'suspended';
  activityScore: number;
}

export interface DeveloperUser {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  submittedAt: string;
  approvedAt?: string;
  bio?: string;
  website?: string;
  appsCount: number;
}

export interface CampaignTask {
  id: string;
  day: number; // e.g., Day 1, Day 2, Day 7, Day 14
  title: string;
  description: string;
  isRequired: boolean;
  points: number;
}

export interface CampaignReward {
  type: 'cash' | 'gift_card' | 'lifetime_sub' | 'exclusive_badge' | 'points';
  title: string;
  value?: string;
  description: string;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'choice';
  options?: string[];
}

export interface CampaignSurvey {
  id: string;
  title: string;
  triggerDay: number;
  questions: SurveyQuestion[];
}

export interface AppCampaign {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  iconUrl: string;
  screenshots: string[];
  developerId: string;
  developerName: string;
  platform: 'android' | 'ios' | 'both';
  testType: 'google_play_closed' | 'testflight' | 'apk_download' | 'web_beta';
  testUrl: string; // رابط الاختبار المغلق - لا يظهر للمختبر إلا بحالة ready_to_join أو بعدها
  version: string;
  durationDays: number; // مثلا 14 يوم لقوقل بلاي
  requiredTestersCount: number;
  currentTestersCount: number;
  targetCountries: string[];
  targetDevices: string[];
  minOsVersion: string;
  testingInstructions: string;
  reward?: CampaignReward;
  category: 'productivity' | 'finance' | 'health' | 'social' | 'games' | 'education' | 'tools';
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  tasks: CampaignTask[];
  surveys?: CampaignSurvey[];
  createdAt: string;
  isFeatured?: boolean;
}

export interface TesterApplication {
  id: string;
  campaignId: string;
  appName: string;
  appIcon: string;
  platform: 'android' | 'ios' | 'both';
  testerId: string;
  testerName: string;
  testerEmail: string;
  googlePlayEmail: string;
  testerCountry: string;
  deviceModel: string;
  osType: 'android' | 'ios';
  osVersion: string;
  status: TesterStatus;
  appliedAt: string;
  whitelistedAt?: string;
  joinedAt?: string;
  completedAt?: string;
  currentDay: number; // e.g. Day 6 of 14
  completedTaskIds: string[];
  activityScore: number; // 0 - 100
  lastActiveDate: string;
  developerNotes?: string;
}

export interface BugReport {
  id: string;
  campaignId: string;
  appName: string;
  testerId: string;
  testerName: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stepsToReproduce: string;
  deviceInfo: string;
  screenshotUrl?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface TesterFeedback {
  id: string;
  campaignId: string;
  appName: string;
  testerId: string;
  testerName: string;
  rating: number; // 1 - 5
  category: 'ui_ux' | 'performance' | 'feature_request' | 'general';
  comment: string;
  createdAt: string;
  isHelpful?: boolean;
  taskId?: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  campaignId: string;
  testerId: string;
  testerName: string;
  answers: Record<string, any>;
  submittedAt: string;
}

export interface EmailNotification {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  previewText: string;
  body: string;
  type:
    | 'accepted'
    | 'whitelisted_ready'
    | 'new_task'
    | 'inactivity_warning'
    | 'campaign_ending'
    | 'completed'
    | 'reward_issued'
    | 'developer_approved';
  sentAt: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  eventType:
    | 'auth_login'
    | 'role_switch'
    | 'link_unlocked'
    | 'unauthorized_link_attempt'
    | 'bulk_email_export'
    | 'tester_whitelisted'
    | 'data_deletion_requested'
    | 'developer_approved'
    | 'developer_suspended'
    | 'xss_sanitized'
    | 'bot_detected'
    | 'disposable_email_blocked'
    | 'emergency_lockdown_enabled'
    | 'emergency_lockdown_disabled'
    | 'two_factor_verified'
    | 'leak_watermark_generated'
    | 'security_scan_executed'
    | 'ip_blocked';
  status: 'ALLOWED' | 'BLOCKED' | 'FLAGGED';
  details: string;
  ipAddress: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
