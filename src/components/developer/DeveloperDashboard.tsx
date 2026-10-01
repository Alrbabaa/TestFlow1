import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AppCampaign, TesterApplication, BugReport, CampaignTask } from '../../types';
import { maskSensitiveEmail, validateSecureUrl, sanitizeInput } from '../../utils/security';
import { exportTestersToCsv, copyTesterGmailsToClipboard } from '../../utils/exportTesters';
import { AppIconImage } from '../common/AppIconImage';
import {
  Code2,
  Plus,
  Users,
  Smartphone,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Search,
  Filter,
  Bug,
  MessageSquare,
  AlertTriangle,
  Send,
  Trash2,
  Calendar,
  Award,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  UserCheck,
  Hourglass,
  Target,
  BarChart3,
  PieChart,
  Sparkles,
  Upload,
  ArrowUpRight,
  CheckCheck,
  PlayCircle,
  Flame,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  Download,
  FileText,
  Mail,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';

// Lightweight, crisp SVG Circular Gauge Chart
const CircularGauge: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  gradientId?: string;
  startColor?: string;
  endColor?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}> = ({
  percentage,
  size = 68,
  strokeWidth = 6.5,
  color = '#2563eb',
  gradientId,
  startColor,
  endColor,
  trackColor = '#f1f5f9',
  label,
  sublabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center select-none shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {gradientId && startColor && endColor && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradientId ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-black text-slate-900 leading-none">
          {label ?? `${Math.round(percentage)}%`}
        </span>
        {sublabel && (
          <span className="text-[9px] font-semibold text-slate-400 mt-0.5 leading-none">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    currentDeveloper,
    campaigns,
    applications,
    bugReports,
    feedbacks,
    addCampaign,
    confirmWhitelisted,
    confirmBulkWhitelisted,
    updateApplicationStatus,
    updateBugStatus,
    setSelectedCampaignSlug,
    setCurrentUserRole,
    setActiveTab,
    currentUserRole,
    isEmailMasked,
    setIsEmailMasked,
    logSecurityEvent,
  } = useApp();

  // Developer only sees their own campaigns
  const myCampaigns = campaigns.filter((c) => c.developerId === user?.uid);

  // Selected campaign for tester management (default to first or 'all')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    myCampaigns[0]?.id || 'all'
  );

  // Tester filter tab
  const [testerStatusFilter, setTesterStatusFilter] = useState<string>('all');
  const [searchTester, setSearchTester] = useState('');
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('filtered');

  // Bulk selection
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // New App Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAppForm, setNewAppForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    ],
    platform: 'android' as 'android' | 'ios' | 'both',
    testType: 'google_play_closed' as AppCampaign['testType'],
    testUrl: 'https://play.google.com/apps/testing/com.example.app',
    version: '1.0.0-beta',
    durationDays: 14,
    requiredTestersCount: 20,
    targetCountries: ['المملكة العربية السعودية', 'الإمارات', 'مصر'],
    minOsVersion: 'Android 11.0+',
    testingInstructions: '1. فتح التطبيق يومياً لمدة 3 دقائق.\n2. تجربة الميزات الأساسية وكتابة ملاحظاتك.',
    category: 'productivity' as AppCampaign['category'],
    rewardTitle: 'قسيمة بقيمة 15$ + اشتراك مميز',
    rewardValue: '15$',
    rewardDescription: 'تمنح لكل مختبر يكمل 14 يوماً مع تنفيذ المهام المطلوبة.',
  });

  // Filter applications belonging only to this developer's apps
  const myAppIds = myCampaigns.map((c) => c.id);
  const myApplications = applications.filter((a) => myAppIds.includes(a.campaignId));

  const filteredApplications = myApplications.filter((app) => {
    if (selectedCampaignId !== 'all' && app.campaignId !== selectedCampaignId) return false;
    if (testerStatusFilter !== 'all' && app.status !== testerStatusFilter) return false;
    if (searchTester.trim()) {
      const q = searchTester.toLowerCase();
      const matchName = app.testerName.toLowerCase().includes(q);
      const matchEmail = app.testerEmail.toLowerCase().includes(q);
      const matchPlayEmail = app.googlePlayEmail.toLowerCase().includes(q);
      const matchDevice = app.deviceModel.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPlayEmail && !matchDevice) return false;
    }
    return true;
  });
  const selectedVisibleApplications = filteredApplications.filter((app) =>
    selectedAppIds.includes(app.id)
  );
  const allVisibleApplicationsSelected =
    filteredApplications.length > 0 &&
    filteredApplications.every((app) => selectedAppIds.includes(app.id));

  // Filter bug reports for developer's apps
  const myBugReports = bugReports.filter((b) => myAppIds.includes(b.campaignId));
  const myFeedbacks = feedbacks.filter((f) => myAppIds.includes(f.campaignId));

  // If developer status is pending
  if (currentDeveloper.status === 'pending_approval') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">
          حساب المطور قيد المراجعة والاعتماد
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          أهلاً بك يا <strong>{currentDeveloper.name}</strong> ({currentDeveloper.companyName}). تم
          استلام طلبك وهو قيد المراجعة من قبل إدارة TestFlow لضمان جودة المشاريع ومكافآت المختبرين.
        </p>
      </div>
    );
  }

  // Export Toast state
  const [exportNotification, setExportNotification] = useState<string | null>(null);
  const showExportNotification = (msg: string) => {
    setExportNotification(msg);
    setTimeout(() => setExportNotification(null), 3500);
  };

  // Handle Copy Emails (filtered or selected) for Google Play Closed Testing
  const handleCopyGooglePlayEmails = async (targetApps: TesterApplication[] = filteredApplications) => {
    if (targetApps.length === 0) {
      alert('لا يوجد مختبرون لنسخ إيميلاتهم.');
      return;
    }

    const count = await copyTesterGmailsToClipboard(targetApps, 'comma');
    setCopiedEmails(true);
    setTimeout(() => setCopiedEmails(false), 2500);
    showExportNotification(`تم نسخ ${count} بريد Gmail للحافظة بنجاح (جاهز للكونسول)!`);

    logSecurityEvent({
      actor: currentDeveloper.companyName,
      actorRole: currentUserRole,
      eventType: 'bulk_email_export',
      status: 'ALLOWED',
      details: `قام المطور بنسخ قائمة إيميلات المختبرين (${count} بريداً) لإضافتها في Google Play Console.`,
      ipAddress: '176.224.***.*** (Authenticated Dev)',
      severity: 'medium',
    });
  };

  // Handle CSV Export (Full or Gmail-only, for all, filtered, or selected)
  const handleExportTestersCsv = (
    mode: 'full' | 'gmail_only' = 'full',
    scope: 'all' | 'filtered' | 'selected' = 'filtered'
  ) => {
    let targetList: TesterApplication[] = [];

    if (scope === 'selected') {
      targetList = selectedVisibleApplications;
    } else if (scope === 'all') {
      targetList = myApplications;
    } else {
      targetList = filteredApplications;
    }

    if (targetList.length === 0) {
      alert('لا توجد بيانات مختبرين متاحة للتصدير وفق الخيارات المحددة.');
      return;
    }

    const currentCampaignName =
      selectedCampaignId === 'all'
        ? 'all-apps'
        : myCampaigns.find((c) => c.id === selectedCampaignId)?.slug || 'app';

    const filename =
      mode === 'gmail_only'
        ? `testflow-gmail-${currentCampaignName}-${new Date().toISOString().split('T')[0]}.csv`
        : `testflow-testers-${currentCampaignName}-${new Date().toISOString().split('T')[0]}.csv`;

    exportTestersToCsv({
      applications: targetList,
      campaigns: myCampaigns,
      mode,
      filename,
    });

    showExportNotification(
      mode === 'gmail_only'
        ? `تم تنزيل ملف CSV لإيميلات Gmail (${targetList.length} مختبر) بنجاح!`
        : `تم تنزيل ملف CSV الكامل لبيانات المختبرين (${targetList.length} مختبر) بنجاح!`
    );

    logSecurityEvent({
      actor: currentDeveloper.companyName,
      actorRole: currentUserRole,
      eventType: 'bulk_email_export',
      status: 'ALLOWED',
      details: `قام المطور بتصدير ملف CSV (${mode}) لعدد ${targetList.length} مختبر.`,
      ipAddress: '176.224.***.*** (Authenticated Dev)',
      severity: 'medium',
    });
  };

  // Handle Add Campaign Submit
  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppForm.name || !newAppForm.slug) return;

    // AppSec: Validate external test URL protocol
    const urlValidation = validateSecureUrl(newAppForm.testUrl);
    if (!urlValidation.isValid) {
      logSecurityEvent({
        actor: currentDeveloper.companyName,
        actorRole: currentUserRole,
        eventType: 'unauthorized_link_attempt',
        status: 'BLOCKED',
        details: `محاولة إضافة رابط تطبيق غير مشفر أو غير آمن (${newAppForm.testUrl}): ${urlValidation.error}`,
        ipAddress: '176.224.***.*** (Developer Console)',
        severity: 'high',
      });
      alert(`⚠️ تنبيه أمني: ${urlValidation.error}`);
      return;
    }

    const defaultTasks: CampaignTask[] = [
      {
        id: `t-${Date.now()}-1`,
        day: 1,
        title: 'تثبيت التطبيق وتسجيل الدخول',
        description: 'قم بتثبيت التطبيق من رابط المتجر المعتمد.',
        isRequired: true,
        points: 20,
      },
      {
        id: `t-${Date.now()}-2`,
        day: 3,
        title: 'تجربة الميزات الرئيسية',
        description: 'استكشف واجهات التطبيق وتأكد من استقرار الأداء.',
        isRequired: true,
        points: 20,
      },
      {
        id: `t-${Date.now()}-3`,
        day: 7,
        title: 'استبيان منتصف فترة الاختبار',
        description: 'تقييم تجربة الاستخدام واستقرار البطارية.',
        isRequired: true,
        points: 25,
      },
      {
        id: `t-${Date.now()}-4`,
        day: 14,
        title: 'إتمام الـ 14 يوماً والتقييم النهائي',
        description: 'تأكيد استمرار التطبيق مثبت ومراجعة التجربة.',
        isRequired: true,
        points: 50,
      },
    ];

    try {
      await addCampaign({
      name: sanitizeInput(newAppForm.name),
      slug: sanitizeInput(newAppForm.slug.toLowerCase().replace(/\s+/g, '-')),
      tagline: sanitizeInput(newAppForm.tagline),
      description: sanitizeInput(newAppForm.description),
      iconUrl: newAppForm.iconUrl,
      screenshots: newAppForm.screenshots,
      developerId: user!.uid,
      developerName: currentDeveloper.companyName,
      platform: newAppForm.platform,
      testType: newAppForm.testType,
      testUrl: newAppForm.testUrl.trim(),
      version: sanitizeInput(newAppForm.version),
      durationDays: Number(newAppForm.durationDays),
      requiredTestersCount: Number(newAppForm.requiredTestersCount),
      targetCountries: newAppForm.targetCountries,
      targetDevices: ['Android & iOS Devices'],
      minOsVersion: sanitizeInput(newAppForm.minOsVersion),
      testingInstructions: sanitizeInput(newAppForm.testingInstructions),
      category: newAppForm.category,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'active',
      tasks: defaultTasks,
      reward: {
        type: 'gift_card',
        title: sanitizeInput(newAppForm.rewardTitle),
        value: sanitizeInput(newAppForm.rewardValue),
        description: sanitizeInput(newAppForm.rewardDescription),
      },
      });
      setIsAddModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'تعذر حفظ الحملة. تحقق من اتصال قاعدة البيانات وحاول مرة أخرى.');
    }
  };

  // Calculations for Tester Status Summaries and Completion Gauges
  const totalApplicants = myApplications.length;
  const totalTargetTesters =
    myCampaigns.reduce((sum, c) => sum + c.requiredTestersCount, 0) || 20;

  // Accepted (anyone approved, whitelisted, ready, active, or completed)
  const acceptedApplications = myApplications.filter((a) =>
    [
      'accepted',
      'waiting_for_whitelisting',
      'ready_to_join',
      'joined',
      'active',
      'completed',
    ].includes(a.status)
  );
  const acceptedCount = acceptedApplications.length;
  const acceptedRatioOfTarget =
    totalTargetTesters > 0
      ? Math.min(100, Math.round((acceptedCount / totalTargetTesters) * 100))
      : 0;
  const acceptanceRate =
    totalApplicants > 0 ? Math.round((acceptedCount / totalApplicants) * 100) : 0;

  // Active testers
  const activeApplications = myApplications.filter(
    (a) => a.status === 'active' || a.status === 'joined'
  );
  const activeCount = activeApplications.length;
  const activeEngagementRate =
    acceptedCount > 0 ? Math.min(100, Math.round((activeCount / acceptedCount) * 100)) : 0;

  // Average days completed by active & ready testers
  const relevantTestersForDays = myApplications.filter((a) =>
    ['active', 'joined', 'completed'].includes(a.status)
  );
  const avgDaysCompleted =
    relevantTestersForDays.length > 0
      ? (
          relevantTestersForDays.reduce((acc, a) => acc + (a.currentDay || 1), 0) /
          relevantTestersForDays.length
        ).toFixed(1)
      : '0.0';

  // Days distribution for mini bar chart (1-3, 4-7, 8-11, 12-14)
  const daysD1to3 = relevantTestersForDays.filter((a) => (a.currentDay || 1) <= 3).length;
  const daysD4to7 = relevantTestersForDays.filter(
    (a) => (a.currentDay || 1) >= 4 && (a.currentDay || 1) <= 7
  ).length;
  const daysD8to11 = relevantTestersForDays.filter(
    (a) => (a.currentDay || 1) >= 8 && (a.currentDay || 1) <= 11
  ).length;
  const daysD12to14 = relevantTestersForDays.filter((a) => (a.currentDay || 1) >= 12).length;
  const maxDayGroupCount = Math.max(1, daysD1to3, daysD4to7, daysD8to11, daysD12to14);

  // Waiting for Whitelisting
  const waitingApplications = myApplications.filter(
    (a) => a.status === 'waiting_for_whitelisting'
  );
  const waitingCount = waitingApplications.length;
  const readyApplications = myApplications.filter((a) => a.status === 'ready_to_join');
  const readyCount = readyApplications.length;
  const whitelistingCompletionRate =
    waitingCount + readyCount + activeCount > 0
      ? Math.round(((readyCount + activeCount) / (waitingCount + readyCount + activeCount)) * 100)
      : 100;

  // Completed & Pending
  const completedCount = myApplications.filter((a) => a.status === 'completed').length;
  const pendingCount = myApplications.filter((a) => a.status === 'pending').length;

  // Overall Task Completion
  let totalTasksRequired = 0;
  let totalTasksCompleted = 0;
  myApplications.forEach((app) => {
    const camp = campaigns.find((c) => c.id === app.campaignId);
    if (camp) {
      totalTasksRequired += camp.tasks.length;
      totalTasksCompleted += app.completedTaskIds.length;
    }
  });
  const overallTaskCompletionRate =
    totalTasksRequired > 0 ? Math.round((totalTasksCompleted / totalTasksRequired) * 100) : 0;

  // Composite Google Play Closed Track Readiness Score
  const readinessScore = Math.min(
    100,
    Math.round(
      acceptedRatioOfTarget * 0.4 +
        activeEngagementRate * 0.35 +
        (Math.min(14, Number(avgDaysCompleted)) / 14) * 100 * 0.25
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Developer Header & Summary Stats */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md">
            <Code2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentDeveloper.companyName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                مطور معتمد
              </span>
            </div>
            <p className="text-xs text-slate-500">
              المسؤول: {currentDeveloper.name} ({currentDeveloper.email})
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          إضافة تطبيق / حملة اختبار جديدة
        </button>
      </div>

      {/* Enhanced Status Summary Cards & Completion Gauges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              ملخص حالات المختبرين ومؤشرات الإنجاز (Tester Status & Completion KPIs)
            </h2>
            <p className="text-xs text-slate-500">
              متابعة فورية للمقبولين، النشطين، والمنتظرين للإضافة في Google Play Closed Testing
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            إجمالي المتقدمين: {totalApplicants}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: ACCEPTED TESTERS */}
          <div
            onClick={() => setTesterStatusFilter(testerStatusFilter === 'ready_to_join' ? 'all' : 'ready_to_join')}
            className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
              testerStatusFilter === 'ready_to_join'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
                : 'border-slate-200/90 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  <UserCheck className="w-3.5 h-3.5" />
                  المختبرون المقبولون
                </span>
                <h3 className="text-2xl font-black text-slate-900 pt-1">{acceptedCount}</h3>
                <p className="text-[11px] text-slate-500">
                  من أصل <strong className="text-slate-700">{totalTargetTesters}</strong> مطلوبين
                </p>
              </div>

              {/* Circular Gauge for Target Progress */}
              <CircularGauge
                percentage={acceptedRatioOfTarget}
                color="#2563eb"
                gradientId="gauge-blue"
                startColor="#1d4ed8"
                endColor="#38bdf8"
                sublabel="من الهدف"
              />
            </div>

            {/* Linear Progress: Acceptance rate from applicants */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">معدل القبول العام:</span>
                <span className="font-bold text-blue-700">{acceptanceRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-700 to-sky-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, acceptanceRate)}%` }}
                />
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>هدف Google Play: 20 مختبراً</span>
                <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                  تصفية بالجدول <ArrowRight className="w-2.5 h-2.5 rotate-180" />
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: ACTIVE DAILY TESTERS */}
          <div
            onClick={() => setTesterStatusFilter(testerStatusFilter === 'active' ? 'all' : 'active')}
            className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
              testerStatusFilter === 'active'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                : 'border-slate-200/90 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  <Activity className="w-3.5 h-3.5" />
                  المختبرون النشطون
                </span>
                <h3 className="text-2xl font-black text-slate-900 pt-1">{activeCount}</h3>
                <p className="text-[11px] text-slate-500">
                  يلتزمون بفتح التطبيق يومياً
                </p>
              </div>

              {/* Circular Gauge for Engagement */}
              <CircularGauge
                percentage={activeEngagementRate}
                color="#059669"
                gradientId="gauge-emerald"
                startColor="#059669"
                endColor="#34d399"
                sublabel="التزام"
              />
            </div>

            {/* Mini Column Bar Chart of Days Distribution */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">متوسط الأيام المكتملة:</span>
                <span className="font-bold text-emerald-700">{avgDaysCompleted} / 14 يوماً</span>
              </div>

              {/* 4 Mini Bar Columns showing progression across test periods */}
              <div className="flex items-end justify-between gap-1.5 h-8 pt-1">
                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-emerald-200 rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max(15, (daysD1to3 / maxDayGroupCount) * 100)}%`,
                    }}
                    title={`أيام 1-3: ${daysD1to3} مختبرين`}
                  />
                  <span className="text-[8px] text-slate-400 font-bold leading-none">1-3د</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-emerald-400 rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max(15, (daysD4to7 / maxDayGroupCount) * 100)}%`,
                    }}
                    title={`أيام 4-7: ${daysD4to7} مختبرين`}
                  />
                  <span className="text-[8px] text-slate-400 font-bold leading-none">4-7د</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-emerald-600 rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max(15, (daysD8to11 / maxDayGroupCount) * 100)}%`,
                    }}
                    title={`أيام 8-11: ${daysD8to11} مختبرين`}
                  />
                  <span className="text-[8px] text-slate-400 font-bold leading-none">8-11د</span>
                </div>

                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-emerald-700 rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max(15, (daysD12to14 / maxDayGroupCount) * 100)}%`,
                    }}
                    title={`أيام 12-14: ${daysD12to14} مختبرين`}
                  />
                  <span className="text-[8px] text-slate-400 font-bold leading-none">12-14د</span>
                </div>
              </div>

              <div className="pt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>توزيع تقدم أيام الـ 14</span>
                <span className="text-emerald-600 font-bold group-hover:underline flex items-center gap-0.5">
                  عرض النشطين <ArrowRight className="w-2.5 h-2.5 rotate-180" />
                </span>
              </div>
            </div>
          </div>

          {/* CARD 3: WAITING FOR WHITELISTING */}
          <div
            onClick={() =>
              setTesterStatusFilter(
                testerStatusFilter === 'waiting_for_whitelisting'
                  ? 'all'
                  : 'waiting_for_whitelisting'
              )
            }
            className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
              testerStatusFilter === 'waiting_for_whitelisting'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                : 'border-slate-200/90 hover:border-amber-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Hourglass className="w-3.5 h-3.5" />
                  بانتظار القائمة البيضاء
                </span>
                <h3 className="text-2xl font-black text-amber-700 pt-1">{waitingCount}</h3>
                <p className="text-[11px] text-slate-500">
                  {waitingCount > 0 ? 'يتطلب إضافة بريدهم لقوقل بلاي' : 'تم اعتماد كافة الإيميلات'}
                </p>
              </div>

              {/* Circular Gauge for Whitelisted Completion */}
              <CircularGauge
                percentage={whitelistingCompletionRate}
                color="#d97706"
                gradientId="gauge-amber"
                startColor="#b45309"
                endColor="#f59e0b"
                sublabel="معتمد"
              />
            </div>

            {/* Quick Action or Status */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {waitingCount > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const waitingIds = waitingApplications.map((w) => w.id);
                    confirmBulkWhitelisted(waitingIds);
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] shadow-2xs transition-all flex items-center justify-center gap-1.5 animate-pulse"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  تأكيد إضافة الجميع ({waitingCount})
                </button>
              ) : (
                <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  جميع الإيميلات مضافة ومفعلة!
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Google Play Console Ready</span>
                <span className="text-amber-700 font-bold group-hover:underline flex items-center gap-0.5">
                  تصفية المنتظرين <ArrowRight className="w-2.5 h-2.5 rotate-180" />
                </span>
              </div>
            </div>
          </div>

          {/* CARD 4: GOOGLE PLAY READINESS SCORE */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    جاهزية النشر على المتجر
                  </span>
                  <h3 className="text-2xl font-black text-white pt-1">{readinessScore}%</h3>
                  <p className="text-[11px] text-slate-300">
                    مؤشر استيفاء شروط Closed Track
                  </p>
                </div>

                <CircularGauge
                  percentage={readinessScore}
                  color="#38bdf8"
                  gradientId="gauge-sky"
                  startColor="#2563eb"
                  endColor="#38bdf8"
                  trackColor="#334155"
                  label={`${readinessScore}%`}
                  sublabel="جاهزية"
                />
              </div>

              {/* Milestones Checklist Bars */}
              <div className="space-y-1.5 text-[10px] pt-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>حصة المختبرين (Target 20):</span>
                  <span className="font-bold text-white">
                    {acceptedCount} / {totalTargetTesters}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full"
                    style={{ width: `${Math.min(100, (acceptedCount / totalTargetTesters) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-slate-300 pt-0.5">
                  <span>إنجاز المهام واستقرار التطبيق:</span>
                  <span className="font-bold text-emerald-400">
                    {overallTaskCompletionRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, overallTaskCompletionRate)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {readinessScore >= 80 ? 'جاهز تقريباً لطلب النشر' : 'في طور استكمال الـ 14 يوماً'}
              </span>
              <span>14 Days Track</span>
            </div>
          </div>
        </div>

        {/* Interactive Funnel Distribution Segmented Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-blue-600" />
              توزيع حالات المختبرين الكلي (انقر على أي حالة لتصفية الجدول أدناه):
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>{myApplications.length} طلباً إجمالياً</span>
              {testerStatusFilter !== 'all' && (
                <button
                  onClick={() => setTesterStatusFilter('all')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  إلغاء التصفية (عرض الكل)
                </button>
              )}
            </div>
          </div>

          {/* Multi-segment progress bar */}
          <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden cursor-pointer">
            {activeCount > 0 && (
              <div
                onClick={() => setTesterStatusFilter('active')}
                style={{
                  width: `${(activeCount / Math.max(1, myApplications.length)) * 100}%`,
                }}
                className="bg-emerald-500 hover:bg-emerald-600 transition-colors"
                title={`النشطون يومياً: ${activeCount}`}
              />
            )}
            {readyCount > 0 && (
              <div
                onClick={() => setTesterStatusFilter('ready_to_join')}
                style={{
                  width: `${(readyCount / Math.max(1, myApplications.length)) * 100}%`,
                }}
                className="bg-blue-600 hover:bg-blue-700 transition-colors"
                title={`المقبولين الجاهزين: ${readyCount}`}
              />
            )}
            {waitingCount > 0 && (
              <div
                onClick={() => setTesterStatusFilter('waiting_for_whitelisting')}
                style={{
                  width: `${(waitingCount / Math.max(1, myApplications.length)) * 100}%`,
                }}
                className="bg-amber-500 hover:bg-amber-600 transition-colors"
                title={`بانتظار القائمة البيضاء: ${waitingCount}`}
              />
            )}
            {completedCount > 0 && (
              <div
                onClick={() => setTesterStatusFilter('completed')}
                style={{
                  width: `${(completedCount / Math.max(1, myApplications.length)) * 100}%`,
                }}
                className="bg-purple-600 hover:bg-purple-700 transition-colors"
                title={`المكتملون 14 يوماً: ${completedCount}`}
              />
            )}
            {pendingCount > 0 && (
              <div
                onClick={() => setTesterStatusFilter('pending')}
                style={{
                  width: `${(pendingCount / Math.max(1, myApplications.length)) * 100}%`,
                }}
                className="bg-slate-300 hover:bg-slate-400 transition-colors"
                title={`قيد المراجعة: ${pendingCount}`}
              />
            )}
          </div>

          {/* Legend chips */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
            <button
              onClick={() => setTesterStatusFilter('active')}
              className={`flex items-center gap-1.5 font-medium transition-all ${
                testerStatusFilter === 'active' ? 'font-bold text-emerald-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              النشطون: {activeCount} (
              {Math.round((activeCount / Math.max(1, myApplications.length)) * 100)}%)
            </button>

            <button
              onClick={() => setTesterStatusFilter('ready_to_join')}
              className={`flex items-center gap-1.5 font-medium transition-all ${
                testerStatusFilter === 'ready_to_join' ? 'font-bold text-blue-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              جاهز / ظهر الرابط: {readyCount} (
              {Math.round((readyCount / Math.max(1, myApplications.length)) * 100)}%)
            </button>

            <button
              onClick={() => setTesterStatusFilter('waiting_for_whitelisting')}
              className={`flex items-center gap-1.5 font-medium transition-all ${
                testerStatusFilter === 'waiting_for_whitelisting' ? 'font-bold text-amber-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              بانتظار القائمة: {waitingCount} (
              {Math.round((waitingCount / Math.max(1, myApplications.length)) * 100)}%)
            </button>

            {completedCount > 0 && (
              <button
                onClick={() => setTesterStatusFilter('completed')}
                className={`flex items-center gap-1.5 font-medium transition-all ${
                  testerStatusFilter === 'completed' ? 'font-bold text-purple-800' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                أكمل 14 يوماً: {completedCount}
              </button>
            )}

            {pendingCount > 0 && (
              <button
                onClick={() => setTesterStatusFilter('pending')}
                className={`flex items-center gap-1.5 font-medium transition-all ${
                  testerStatusFilter === 'pending' ? 'font-bold text-slate-800' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                قيد المراجعة: {pendingCount}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cybersecurity & AppSec Defense Shield for Developers */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-white">درع الحماية وعزل البيانات (RBAC &amp; Anti-Leak Shield)</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                بياناتك معزولة 100%
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              بيانات حملاتك ومختبريك معزولة تماماً ولا يمكن لأي مطور آخر الوصول إليها • روابط Google Play المغلقة محجوبة خلف التحقق • درع مكافحة البوتات مفعل لحماية شرط الـ 14 يوماً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => setIsEmailMasked(!isEmailMasked)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isEmailMasked
                ? 'bg-blue-900/60 border-blue-500/40 text-blue-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="تفعيل أو تعطيل حجب إيميلات المختبرين للحماية"
          >
            {isEmailMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isEmailMasked ? 'حجب PII نشط' : 'إظهار الإيميلات'}</span>
          </button>
        </div>
      </div>

      {/* My Apps & Public URLs Showcase */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-black text-slate-900">
          تطبيقاتي والروابط المستقلة (Campaign URLs):
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCampaigns.map((camp) => {
            const publicLink = `${window.location.origin}/test/${camp.slug}`;
            const campTesters = applications.filter((a) => a.campaignId === camp.id);

            return (
              <div
                key={camp.id}
                className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/40 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <AppIconImage
                    src={camp.iconUrl}
                    alt={camp.name}
                    category={camp.category}
                    appName={camp.name}
                    platform={camp.platform}
                    className="w-12 h-12 rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{camp.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {camp.platform}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      المختبرون: {campTesters.length} / {camp.requiredTestersCount} (هدف Google Play)
                    </p>
                  </div>
                </div>

                {/* Independent Link Box */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2">
                  <div className="truncate text-slate-600 font-mono text-[11px] dir-ltr text-left">
                    platform.com/test/{camp.slug}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publicLink);
                        setCopiedSlug(camp.slug);
                        setTimeout(() => setCopiedSlug(null), 2000);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      title="نسخ الرابط المستقل لاستخدامه في الإعلانات وشبكات التواصل"
                    >
                      {copiedSlug === camp.slug ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedCampaignSlug(camp.slug)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      title="معاينة الصفحة العامة المستقلة"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tester Management Hub */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-5">
        {/* Export / Action Notification Banner */}
        {exportNotification && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotification}</span>
            </div>
            <button
              onClick={() => setExportNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-black text-slate-900">
                إدارة مختبري التطبيقات (Closed Testing Management)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              متابعة المتقدمين، اعتماد القوائم البيضاء في Google Play Console، وتصدير إيميلات الـ Gmail
            </p>
          </div>

          {/* Clean, Organized Utility Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Privacy Toggle Button */}
            <button
              onClick={() => setIsEmailMasked(!isEmailMasked)}
              className={`h-9 px-3 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                isEmailMasked
                  ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
              title="تفعيل أو إلغاء إخفاء أجزاء من الإيميل لحماية الخصوصية"
            >
              {isEmailMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isEmailMasked ? 'إظهار الإيميلات' : 'إخفاء الإيميلات (PDPL)'}</span>
            </button>

            {/* Copy All Gmails Button */}
            <button
              onClick={() => handleCopyGooglePlayEmails(filteredApplications)}
              className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              title="نسخ جميع إيميلات Gmail المصفاة حالياً ولصقها مباشرة في Google Play Console"
            >
              {copiedEmails ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmails ? 'تم النسخ!' : 'نسخ إيميلات Gmail'}</span>
            </button>

            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as 'all' | 'filtered')}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              aria-label="نطاق تصدير بيانات المختبرين"
            >
              <option value="filtered">الصفوف الظاهرة</option>
              <option value="all">جميع مختبريّ</option>
            </select>

            {/* Export Full CSV */}
            <button
              onClick={() => handleExportTestersCsv('full', exportScope)}
              className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-200/80"
              title="تصدير جدول البيانات الكامل لجميع المختبرين الظاهرين بصيغة CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>تصدير CSV كامل</span>
            </button>

            {/* Export Gmail Only CSV */}
            <button
              onClick={() => handleExportTestersCsv('gmail_only', exportScope)}
              className="h-9 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1.5 border border-emerald-200"
              title="تصدير ملف CSV يحتوي فقط على عمود إيميلات Gmail جاهز للاستيراد المباشر في Google Play"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير قائمة Gmail (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter bar: Select App & Search Box */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* App Selector */}
          <div className="sm:col-span-4">
            <select
              value={selectedCampaignId}
              onChange={(e) => {
                setSelectedCampaignId(e.target.value);
                setSelectedAppIds([]);
              }}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-800"
            >
              <option value="all">جميع تطبيقاتي ({myCampaigns.length})</option>
              {myCampaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currentTestersCount}/{c.requiredTestersCount})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم المختبر، الإيميل، نوع الجهاز، أو نظام التشغيل..."
              value={searchTester}
              onChange={(e) => {
                setSearchTester(e.target.value);
                setSelectedAppIds([]);
              }}
              className="w-full h-10 pr-10 pl-3 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50/50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Status Filter Tabs with Counts */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'الكل', count: myApplications.length },
            {
              id: 'waiting_for_whitelisting',
              label: 'بانتظار الإضافة (Whitelisting)',
              count: myApplications.filter((a) => a.status === 'waiting_for_whitelisting').length,
            },
            {
              id: 'ready_to_join',
              label: 'جاهز للانضمام',
              count: myApplications.filter((a) => a.status === 'ready_to_join').length,
            },
            {
              id: 'active',
              label: 'نشط يومياً',
              count: myApplications.filter((a) => a.status === 'active').length,
            },
            {
              id: 'completed',
              label: 'أكمل 14 يوماً',
              count: myApplications.filter((a) => a.status === 'completed').length,
            },
            {
              id: 'pending',
              label: 'قيد المراجعة',
              count: myApplications.filter((a) => a.status === 'pending').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setTesterStatusFilter(tab.id);
                setSelectedAppIds([]);
              }}
              className={`h-8 px-3 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                testerStatusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  testerStatusFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Selection Action Bar - Appears cleanly when items are selected */}
        {selectedVisibleApplications.length > 0 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                {selectedVisibleApplications.length}
              </span>
              <span>مختبرون محددون من الصفوف الظاهرة</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  confirmBulkWhitelisted(selectedVisibleApplications.map((app) => app.id));
                  setSelectedAppIds([]);
                }}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تأكيد الإضافة للمتجر للمحددين</span>
              </button>

              <button
                onClick={() => {
                  handleCopyGooglePlayEmails(selectedVisibleApplications);
                }}
                className="h-8 px-3 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100/70 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ إيميلات المحددين</span>
              </button>

              <button
                onClick={() => handleExportTestersCsv('full', 'selected')}
                className="h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير المحددين CSV</span>
              </button>

              <button
                onClick={() => handleExportTestersCsv('gmail_only', 'selected')}
                className="h-8 px-3 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gmail المحددين فقط</span>
              </button>

              <button
                onClick={() => setSelectedAppIds([])}
                className="h-8 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {/* Testers Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[980px] text-right text-xs">
            <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleApplicationsSelected}
                    onChange={(e) => {
                      setSelectedAppIds(
                        e.target.checked ? filteredApplications.map((a) => a.id) : []
                      );
                    }}
                    className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
                    title="تحديد الكل الظاهر"
                  />
                </th>
                <th className="py-3 px-3.5">المختبر والدولة</th>
                <th className="py-3 px-3.5">بريد Google Play (Gmail)</th>
                <th className="py-3 px-3.5">الجهاز والنظام</th>
                <th className="py-3 px-3.5">التطبيق المستهدف</th>
                <th className="py-3 px-3.5">الحالة</th>
                <th className="py-3 px-3.5">المهام والنشاط</th>
                <th className="py-3 px-3.5 text-center">إجراءات المطور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700 text-sm">
                        لا يوجد مختبرون مطابقون لهذا التصنيف أو البحث
                      </p>
                      <p className="text-xs text-slate-400">
                        جرّب تغيير فلاتر البحث أو اختيار تطبيق آخر من القائمة أعلاه.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const camp = campaigns.find((c) => c.id === app.campaignId);
                  const isChecked = selectedAppIds.includes(app.id);

                  return (
                    <tr
                      key={app.id}
                      className={`transition-colors ${
                        isChecked ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setSelectedAppIds((current) =>
                              e.target.checked
                                ? [...current, app.id]
                                : current.filter((id) => id !== app.id)
                            );
                          }}
                          className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 text-xs">{app.testerName}</div>
                        <div className="text-[11px] text-slate-400">{app.testerCountry}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-700">
                          <span>
                            {isEmailMasked
                              ? maskSensitiveEmail(app.googlePlayEmail)
                              : app.googlePlayEmail}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(app.googlePlayEmail);
                              showExportNotification(`تم نسخ إيميل ${app.testerName}`);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                            title="نسخ هذا الإيميل فقط"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="text-slate-800 text-xs font-semibold">{app.deviceModel}</div>
                        <div className="text-[10px] text-slate-400">{app.osVersion}</div>
                      </td>

                      <td className="py-3 px-3.5 font-bold text-slate-900 text-xs">{app.appName}</td>

                      <td className="py-3 px-3.5">
                        {app.status === 'waiting_for_whitelisting' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            بانتظار الإضافة لقوقل بلاي
                          </span>
                        )}
                        {app.status === 'ready_to_join' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            مضاف والرابط متاح
                          </span>
                        )}
                        {app.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            نشط يومياً (يوم {app.currentDay || 1})
                          </span>
                        )}
                        {app.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            قيد المراجعة
                          </span>
                        )}
                        {app.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white">
                            <Check className="w-3 h-3" />
                            أكمل 14 يوماً
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
                          <span>
                            {app.completedTaskIds.length} / {camp?.tasks.length || 0} مهام
                          </span>
                        </div>
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                ((app.completedTaskIds.length || 0) / (camp?.tasks.length || 1)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* If waiting for whitelisting or pending: One click confirm */}
                          {(app.status === 'waiting_for_whitelisting' || app.status === 'pending') && (
                            <button
                              onClick={() => confirmWhitelisted(app.id)}
                              className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors flex items-center gap-1"
                              title="تأكيد إضافة البريد في Google Play Console وإظهار رابط التنزيل فوراً للمختبر"
                            >
                              <Check className="w-3 h-3" />
                              <span>تمت الإضافة</span>
                            </button>
                          )}

                          {app.status === 'pending' && (
                            <button
                              onClick={() =>
                                updateApplicationStatus(app.id, 'waiting_for_whitelisting')
                              }
                              className="h-7 px-2.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] hover:bg-blue-100 transition-colors"
                            >
                              قبول مبدئي
                            </button>
                          )}

                          {app.status === 'active' && (
                            <button
                              onClick={() => updateApplicationStatus(app.id, 'completed')}
                              className="h-7 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] hover:bg-emerald-100 transition-colors"
                            >
                              اعتماد الإكمال
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`هل ترغب في استبعاد طلب المختبر ${app.testerName}؟`)) {
                                updateApplicationStatus(app.id, 'rejected');
                              }
                            }}
                            className="h-7 px-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition-colors"
                            title="استبعاد أو رفض"
                          >
                            رفض
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bugs & Feedbacks Hub for Developer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bugs Reported */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Bug className="w-5 h-5 text-rose-600" />
              بلاغات الأخطاء في تطبيقاتي ({myBugReports.length})
            </h3>
          </div>

          <div className="space-y-3">
            {myBugReports.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                لا توجد بلاغات أخطاء حالياً
              </p>
            ) : (
              myBugReports.map((bug) => (
                <div
                  key={bug.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{bug.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        bug.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : bug.severity === 'high'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {bug.severity}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {bug.description}
                  </p>

                  <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                    <span>
                      بواسطة: {bug.testerName} • {bug.deviceInfo}
                    </span>
                    <select
                      value={bug.status}
                      onChange={(e) => updateBugStatus(bug.id, e.target.value as any)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold"
                    >
                      <option value="open">مفتوح (Open)</option>
                      <option value="investigating">قيد الفحص (Investigating)</option>
                      <option value="resolved">تم الإصلاح (Resolved)</option>
                      <option value="dismissed">مستبعد (Dismissed)</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feedback & Satisfaction */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              ملاحظات وآراء المختبرين ({myFeedbacks.length})
            </h3>
          </div>

          <div className="space-y-3">
            {myFeedbacks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">لا توجد ملاحظات مرسلة بعد</p>
            ) : (
              myFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{fb.appName}</span>
                    <span className="text-amber-500 font-bold text-xs">
                      {'★'.repeat(fb.rating)} ({fb.rating}/5)
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    "{fb.comment}"
                  </p>

                  <div className="text-[10px] text-slate-400 pt-1">
                    بواسطة: {fb.testerName} • {fb.createdAt}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add New App & Campaign Modal Wizard */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="font-black text-slate-900 text-base">
                إضافة تطبيق جديد وحملة اختبار مغلقة (Test Campaign)
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم التطبيق *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تطبيق رواق للكتب الصوتية"
                    value={newAppForm.name}
                    onChange={(e) =>
                      setNewAppForm({
                        ...newAppForm,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    الرابط المستقل (Slug) *
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2.5 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-slate-500 font-mono text-[10px]">
                      /test/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="rewaq-audiobooks"
                      value={newAppForm.slug}
                      onChange={(e) => setNewAppForm({ ...newAppForm, slug: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-l-xl border border-slate-200 font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف مختصر وجذاب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: استمع لآلاف الروايات والملخصات المعرفية بصوت نخبوي"
                  value={newAppForm.tagline}
                  onChange={(e) => setNewAppForm({ ...newAppForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف التفصيلي *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="تفاصيل التطبيق وأهداف مرحلة البيتا..."
                  value={newAppForm.description}
                  onChange={(e) => setNewAppForm({ ...newAppForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* App Icon Upload & Category Field */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="block font-bold text-slate-800 text-xs">
                  صورة وأيقونة التطبيق (App Icon) *
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <AppIconImage
                    src={newAppForm.iconUrl}
                    alt={newAppForm.name || 'أيقونة التطبيق'}
                    category={newAppForm.category}
                    appName={newAppForm.name}
                    className="w-16 h-16 rounded-2xl shadow-xs border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 w-full space-y-2">
                    <label className="cursor-pointer py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة التطبيق من الجهاز (PNG / JPG / WebP)</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setNewAppForm({
                                  ...newAppForm,
                                  iconUrl: ev.target.result as string,
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="أو ألصق رابط الأيقونة (Icon URL)..."
                      value={newAppForm.iconUrl.startsWith('data:') ? '' : newAppForm.iconUrl}
                      onChange={(e) => setNewAppForm({ ...newAppForm, iconUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تصنيف التطبيق *</label>
                  <select
                    value={newAppForm.category}
                    onChange={(e) =>
                      setNewAppForm({
                        ...newAppForm,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="productivity">إنتاجية وأعمال</option>
                    <option value="education">تعليم وكتب</option>
                    <option value="finance">مالية وبنوك</option>
                    <option value="health">صحة ولياقة</option>
                    <option value="games">ألعاب وتسلية</option>
                    <option value="tools">أدوات وخدمات</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نظام التشغيل *</label>
                  <select
                    value={newAppForm.platform}
                    onChange={(e) =>
                      setNewAppForm({
                        ...newAppForm,
                        platform: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="android">Android (Google Play)</option>
                    <option value="ios">iOS (TestFlight)</option>
                    <option value="both">كلاهما (Both)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    مدة الاختبار (أيام) *
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={30}
                    value={newAppForm.durationDays}
                    onChange={(e) =>
                      setNewAppForm({
                        ...newAppForm,
                        durationDays: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400">14 يوماً لشرط قوقل بلاي</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    المختبرون المطلوبون *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={newAppForm.requiredTestersCount}
                    onChange={(e) =>
                      setNewAppForm({
                        ...newAppForm,
                        requiredTestersCount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400">20 مختبراً على الأقل لقوقل</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رابط الاختبار المغلق (Google Play Closed Track URL أو TestFlight) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://play.google.com/apps/testing/com.company.app"
                  value={newAppForm.testUrl}
                  onChange={(e) => setNewAppForm({ ...newAppForm, testUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  مهم: هذا الرابط محمي ومخفي تلقائياً، ولن يظهر للمختبر إلا بعد قيامك بتأكيد إضافته
                  للقائمة البيضاء.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان المكافأة</label>
                  <input
                    type="text"
                    value={newAppForm.rewardTitle}
                    onChange={(e) => setNewAppForm({ ...newAppForm, rewardTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">قيمة المكافأة</label>
                  <input
                    type="text"
                    value={newAppForm.rewardValue}
                    onChange={(e) => setNewAppForm({ ...newAppForm, rewardValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  إنشاء التطبيق والحملة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
