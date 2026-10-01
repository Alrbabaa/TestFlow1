import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { TesterApplication, CampaignTask, BugReport } from '../../types';
import { generateWatermarkToken, generateSignedSecureTestUrl } from '../../utils/security';
import { AppIconImage } from '../common/AppIconImage';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  ExternalLink,
  Bug,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Calendar,
  Send,
  Upload,
  Star,
  Check,
  Flame,
  HelpCircle,
  Fingerprint,
  Lock,
  AlertTriangle,
} from 'lucide-react';

export const TesterDashboard: React.FC = () => {
  const { user, signInWithGoogle, getIdToken } = useAuth();
  const {
    currentTester,
    applications,
    campaigns,
    toggleTaskCompletion,
    confirmTesterJoined,
    submitBugReport,
    submitFeedback,
    bugReports,
    feedbacks,
    setActiveTab,
    isLockdownMode,
    isWatermarkEnforced,
  } = useApp();

  // Find all applications for the current authenticated tester
  const myApplications = applications.filter((app) =>
    user
      ? app.testerId === user.uid || app.testerEmail === user.email
      : app.testerId === currentTester.id && app.testerId !== 'guest'
  );

  const myBugsCount = bugReports.filter((b) =>
    user ? b.testerId === user.uid : false
  ).length;

  const completedAppsCount = myApplications.filter((a) => a.status === 'completed').length;
  const activeAppsCount = myApplications.filter((a) => a.status === 'active' || a.status === 'ready_to_join').length;

  // Active testing modal state
  const [activeBugApp, setActiveBugApp] = useState<TesterApplication | null>(null);
  const [activeFeedbackApp, setActiveFeedbackApp] = useState<TesterApplication | null>(null);
  const [activeSurveyApp, setActiveSurveyApp] = useState<TesterApplication | null>(null);

  // Bug report form state
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    severity: 'medium' as BugReport['severity'],
    steps: '',
  });

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    category: 'ui_ux' as 'ui_ux' | 'performance' | 'feature_request' | 'general',
    comment: '',
  });

  // Survey state
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const openAuthorizedTestLink = async (application: TesterApplication, campaignName: string) => {
    const testWindow = window.open('about:blank', '_blank');
    if (!testWindow) return;
    testWindow.opener = null;

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');
      const response = await fetch(`/api/applications/${encodeURIComponent(application.id)}/test-link`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Test link is unavailable');
      const { testUrl } = await response.json();
      testWindow.location.href = generateSignedSecureTestUrl(
        testUrl,
        application.testerId,
        application.testerEmail,
        campaignName
      );
    } catch {
      testWindow.close();
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: TesterApplication['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            قيد المراجعة (Pending)
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            تم القبول (Accepted)
          </span>
        );
      case 'waiting_for_whitelisting':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
            ⏳ بانتظار الإضافة للقائمة البيضاء (Google Play)
          </span>
        );
      case 'ready_to_join':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            🚀 جاهز للانضمام (الرابط متاح الآن!)
          </span>
        );
      case 'joined':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
            تم الانضمام والتثبيت
          </span>
        );
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-2xs">
            نشط يومياً (Active)
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
            🏆 مكتمل بنجاح (14 يوماً)
          </span>
        );
      case 'inactive':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            غير نشط (توقف عن الاستخدام)
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            مرفوض
          </span>
        );
      default:
        return null;
    }
  };

  const getReputationBadgeDetails = () => {
    const rep = currentTester.reputation;
    switch (rep.level) {
      case 'top':
        return {
          title: 'Top Tester ⭐ (مختبر نخبوي)',
          color: 'from-amber-500 to-amber-600 text-white',
          desc: 'أعلى مستوى ثقة! تُمنح لك أولوية القبول في جميع التطبيقات ومكافآت مضاعفة.',
        };
      case 'trusted':
        return {
          title: 'Trusted Tester (مختبر موثوق)',
          color: 'from-blue-600 to-sky-600 text-white',
          desc: 'مستوى التزام مرتفع في فتح التطبيقات يومياً وإرسال ملاحظات ذات قيمة.',
        };
      case 'active':
        return {
          title: 'Active Tester (مختبر نشط)',
          color: 'from-emerald-600 to-teal-600 text-white',
          desc: 'مشارك منتظم في مهام الاختبار وحل الاستبيانات.',
        };
      default:
        return {
          title: 'New Tester (مختبر جديد)',
          color: 'from-slate-700 to-slate-800 text-white',
          desc: 'أكمل أول اختبار لك لرفع تصنيف سمعتك وفتح المزيد من المكافآت.',
        };
    }
  };

  const repDetails = getReputationBadgeDetails();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tester Profile Header & Real Account Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'المختبر'}
              className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-blue-500/20"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white flex items-center justify-center font-black text-xl shadow-md">
              {user ? (user.displayName || user.email || 'TF').slice(0, 2).toUpperCase() : 'TF'}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {user ? user.displayName || user.email?.split('@')[0] : 'لوحة اختبارات التطبيقات'}
              </h1>
              {user && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  حساب معتمد
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {user ? (
                <>البريد: {user.email} • حساب Google Play النشط</>
              ) : (
                <>سجّل الدخول بحساب Google لربط اختباراتك ومتابعة الـ 14 يوماً</>
              )}
            </p>
          </div>
        </div>

        {/* Real Metrics Bar or Sign-in Prompt */}
        {user ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500">التطبيقات المنضم لها</div>
              <div className="text-sm sm:text-base font-black text-slate-900">
                {myApplications.length}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500">قيد الاختبار النشط</div>
              <div className="text-sm sm:text-base font-black text-blue-600">
                {activeAppsCount}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500">الاختبارات المكتملة</div>
              <div className="text-sm sm:text-base font-black text-emerald-600">
                {completedAppsCount}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500">أخطاء تم الإبلاغ عنها</div>
              <div className="text-sm sm:text-base font-black text-amber-600">
                {myBugsCount}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => void signInWithGoogle()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            تسجيل الدخول عبر Google
          </button>
        )}
      </div>

      {/* Main Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">تطبيقاتي وقيد الاختبار</h2>
          <p className="text-xs text-slate-500">
            تابع حالة إضافتك للقوائم البيضاء، أنجز المهام اليومية، وأرسل تقارير الأخطاء
          </p>
        </div>
        <button
          onClick={() => setActiveTab('home')}
          className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl hover:bg-blue-100 transition-colors"
        >
          + تصفح وانضمام لتطبيقات جديدة
        </button>
      </div>

      {/* Applications List */}
      {myApplications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-200/80">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">لم تنضم لأي تطبيق حتى الآن</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            تصفح قائمة التطبيقات المتاحة الآن على متجر التطبيقات وكن من أوائل المختبرين لكسب
            المكافآت
          </p>
          <button
            onClick={() => setActiveTab('home')}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
          >
            تصفح التطبيقات المتاحة
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {myApplications.map((app) => {
            const campaign = campaigns.find((c) => c.id === app.campaignId);
            if (!campaign) return null;

            const isLinkAvailable =
              app.status === 'ready_to_join' ||
              app.status === 'joined' ||
              app.status === 'active' ||
              app.status === 'completed';

            const isWaitingWhitelisting = app.status === 'waiting_for_whitelisting';
            const isPending = app.status === 'pending';

            const totalTasks = campaign.tasks.length;
            const completedTasks = app.completedTaskIds.length;
            const progressPercent =
              totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Application Header Bar */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/40">
                  <div className="flex items-center gap-3.5">
                    <AppIconImage
                      src={app.appIcon || campaign.iconUrl}
                      alt={app.appName}
                      category={campaign.category}
                      appName={app.appName}
                      platform={app.platform}
                      className="w-14 h-14 rounded-2xl shadow-xs border border-slate-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-slate-900 text-base">{app.appName}</h3>
                        <span className="text-xs text-slate-400 font-medium">
                          {campaign.version}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        تاريخ التقديم: {app.appliedAt} • المدة المقررة: {campaign.durationDays} يوماً
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto">
                    {renderStatusBadge(app.status)}
                    <span className="text-[11px] text-slate-400 font-semibold">
                      نقاط النشاط (Activity): {app.activityScore} / 100
                    </span>
                  </div>
                </div>

                {/* Status Specific Action / Notice Banners */}
                {isWaitingWhitelisting && (
                  <div className="p-4 bg-amber-50/90 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-spin" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-950">
                        رابط الاختبار مخفي حالياً (Waiting for Whitelisting):
                      </p>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        قام المطور باعتماد طلبك، ويجري الآن إضافة بريدك الإلكتروني (
                        <span className="font-bold underline">{app.googlePlayEmail}</span>) إلى قائمة
                        Closed Testing في Google Play Console. فور تأكيد المطور، ستتحول الحالة فوراً إلى{' '}
                        <strong>Ready to Join</strong> ويظهر رابط التنزيل هنا وتصلك رسالة تنبيه.
                      </p>
                    </div>
                  </div>
                )}

                {isPending && (
                  <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">طلبك قيد المراجعة لدى المطور:</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        يتم تدقيق توافق جهازك ({app.deviceModel} - {app.osVersion}) مع متطلبات
                        الحملة.
                      </p>
                    </div>
                  </div>
                )}

                {/* Lockdown Mode Warning if active */}
                {isLinkAvailable && isLockdownMode && (
                  <div className="p-4 bg-rose-50 border-b border-rose-200 text-xs text-rose-950 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <p className="font-black text-rose-900">
                        ⚠️ تجميد أمني طارئ للروابط (Emergency Lockdown Mode):
                      </p>
                      <p className="text-rose-800 text-[11px] mt-0.5">
                        تم تعليق فتح روابط التنزيل مؤقتاً بأمر مسؤول الأمن السيبراني (CISO) كإجراء احترازي لحماية سرية النسخة التجريبية.
                      </p>
                    </div>
                  </div>
                )}

                {/* Anti-Leak Forensic Watermark Banner */}
                {isLinkAvailable && !isLockdownMode && isWatermarkEnforced && (
                  <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 text-white text-[11px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>
                        جلسة اختبار سرية مشفرة • بصمة الأمان: <span className="font-mono text-sky-300 font-bold">{generateWatermarkToken(app.testerId, app.testerEmail, campaign.id)}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      محمية بـ NDA • مرخصة لـ: {app.testerName} • تسريب الـ APK يعرضك للحظر القانوني
                    </span>
                  </div>
                )}

                {app.status === 'ready_to_join' && !isLockdownMode && (
                  <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-black text-sm text-emerald-900">
                          🎉 تم اعتماد بريدك بنجاح في متجر التطبيقات!
                        </p>
                        <p className="text-emerald-800 text-[11px]">
                          أصبح رابط الاختبار المغلق جاهزاً للتنزيل والتثبيت على هاتفك.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => void openAuthorizedTestLink(app, campaign.name)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        فتح رابط الاختبار الآمن في المتجر
                      </button>

                      <button
                        onClick={() => confirmTesterJoined(app.id)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                      >
                        تأكيد التثبيت والبدء
                      </button>
                    </div>
                  </div>
                )}

                {/* Testing Progress & Day Counter (For Joined / Active) */}
                {isLinkAvailable && (
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* Top Stats Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">الأيام المكتملة</span>
                        <span className="font-black text-slate-900 text-sm">
                          اليوم {app.currentDay || 1} من {campaign.durationDays}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">إنجاز المهام</span>
                        <span className="font-black text-blue-700 text-sm">
                          {completedTasks} من {totalTasks} ({progressPercent}%)
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">المكافأة المستحقة</span>
                        <span className="font-black text-amber-700 text-sm truncate block">
                          {campaign.reward?.value || 'شارة إنجاز'}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[11px]">رابط التنزيل</span>
                          <span className={`font-bold text-xs ${isLockdownMode ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isLockdownMode ? 'مجمد (طوارئ)' : 'نشط ومشفر'}
                          </span>
                        </div>
                        {isLockdownMode ? (
                          <span
                            className="p-1.5 rounded-lg bg-rose-100 text-rose-600 cursor-not-allowed"
                            title="الرابط مجمد مؤقتاً لحماية أمن النسخة التجريبية"
                          >
                            <Lock className="w-4 h-4" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void openAuthorizedTestLink(app, campaign.name)}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                            title="فتح رابط المتجر الآمن المشفر مجدداً"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 14-Day Visual Timeline Grid */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>مسار التتبع اليومي لـ Google Play Closed Track ({campaign.durationDays} يوماً متواصلاً):</span>
                        </span>
                        <span className="text-blue-700">
                          {Math.round(((app.currentDay || 1) / campaign.durationDays) * 100)}% منجز
                        </span>
                      </div>

                      {/* Day by Day Cells */}
                      <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-1">
                        {Array.from({ length: campaign.durationDays }, (_, i) => {
                          const dayNum = i + 1;
                          const currentDay = app.currentDay || 1;
                          const isCompleted = dayNum < currentDay;
                          const isCurrent = dayNum === currentDay;

                          return (
                            <div
                              key={dayNum}
                              className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                                isCompleted
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : isCurrent
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                              title={`اليوم ${dayNum}: ${isCompleted ? 'مكتمل بنجاح' : isCurrent ? 'اليوم النشط' : 'قيد الانتظار'}`}
                            >
                              <span className="text-[9px] font-bold block opacity-80">يوم</span>
                              <span className="text-xs font-black block">
                                {isCompleted ? '✓' : dayNum}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(((app.currentDay || 1) / campaign.durationDays) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Daily Tasks Checklist */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        المهام المطلوبة للاختبار (Daily Tasks):
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {campaign.tasks.map((task) => {
                          const isDone = app.completedTaskIds.includes(task.id);
                          return (
                            <div
                              key={task.id}
                              onClick={() => toggleTaskCompletion(app.id, task.id)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                isDone
                                  ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                                  : 'bg-white border-slate-200/80 hover:bg-slate-50'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isDone
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>

                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                    اليوم {task.day}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    +{task.points} نقطة نشاط
                                  </span>
                                </div>
                                <h5
                                  className={`text-xs font-bold ${
                                    isDone ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}
                                >
                                  {task.title}
                                </h5>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons: Feedback, Bug, Survey */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setActiveFeedbackApp(app);
                          setFeedbackForm({ rating: 5, category: 'ui_ux', comment: '' });
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        إرسال ملاحظة (Feedback)
                      </button>

                      <button
                        onClick={() => {
                          setActiveBugApp(app);
                          setBugForm({
                            title: '',
                            description: '',
                            severity: 'medium',
                            steps: '',
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Bug className="w-4 h-4" />
                        الإبلاغ عن خلل أو توقف (Bug Report)
                      </button>

                      {campaign.surveys && campaign.surveys.length > 0 && (
                        <button
                          onClick={() => {
                            setActiveSurveyApp(app);
                            setSurveySubmitted(false);
                            setSurveyAnswers({});
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Star className="w-4 h-4" />
                          إكمال استبيان اليوم 7
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Report Bug */}
      {activeBugApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-800">
                <Bug className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm">
                  الإبلاغ عن خلل في تطبيق: {activeBugApp.appName}
                </h3>
              </div>
              <button
                onClick={() => setActiveBugApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitBugReport(
                  activeBugApp.campaignId,
                  bugForm.title,
                  bugForm.description,
                  bugForm.severity,
                  bugForm.steps,
                  `${activeBugApp.deviceModel} (${activeBugApp.osVersion})`
                );
                setActiveBugApp(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان الخطأ أو المشكلة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تعطل التطبيق عند الضغط على زر الحفظ"
                  value={bugForm.title}
                  onChange={(e) => setBugForm({ ...bugForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مستوى الخطورة (Severity) *
                </label>
                <select
                  value={bugForm.severity}
                  onChange={(e) =>
                    setBugForm({ ...bugForm, severity: e.target.value as BugReport['severity'] })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden bg-white"
                >
                  <option value="low">منخفض (Low - خطأ بصري بسيط في المحاذاة)</option>
                  <option value="medium">متوسط (Medium - ميزة لا تعمل كما ينبغي)</option>
                  <option value="high">مرتفع (High - يمنع إكمال عملية مهمة)</option>
                  <option value="critical">حرج (Critical - إغلاق مفاجئ أو تجميد كامل)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  خطوات تكرار الخطأ (Steps to reproduce) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="1. فتح صفحة الحساب&#10;2. النقر على تعديل&#10;3. كتابة الاسم..."
                  value={bugForm.steps}
                  onChange={(e) => setBugForm({ ...bugForm, steps: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  التفاصيل والملاحظات الإضافية
                </label>
                <textarea
                  rows={2}
                  placeholder="ما الذي حدث بدقة؟ وما النتيجة المتوقعة؟"
                  value={bugForm.description}
                  onChange={(e) => setBugForm({ ...bugForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 cursor-pointer hover:bg-slate-100 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>إرفاق لقطة شاشة للخطأ (Screenshot محاكاة)</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveBugApp(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  إرسال البلاغ للمطور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Feedback */}
      {activeFeedbackApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2 text-blue-900">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm">
                  ملاحظات وتجربة استخدام: {activeFeedbackApp.appName}
                </h3>
              </div>
              <button
                onClick={() => setActiveFeedbackApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitFeedback(
                  activeFeedbackApp.campaignId,
                  feedbackForm.rating,
                  feedbackForm.category,
                  feedbackForm.comment
                );
                setActiveFeedbackApp(null);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  تقييمك الإجمالي للتطبيق حتى الآن:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= feedbackForm.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 mr-2">
                    {feedbackForm.rating} من 5 نجوم
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تصنيف الملاحظة:
                </label>
                <select
                  value={feedbackForm.category}
                  onChange={(e) =>
                    setFeedbackForm({
                      ...feedbackForm,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="ui_ux">واجهة وتجربة المستخدم (UI/UX)</option>
                  <option value="performance">سرعة واستقرار الأداء (Performance)</option>
                  <option value="feature_request">اقتراح ميزة جديدة (Feature Request)</option>
                  <option value="general">رأي عام</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رأيك وملاحظاتك المفصلة *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="ما الذي أعجبك؟ وما الذي يحتاج إلى تحسين قبل النشر على المتجر؟"
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveFeedbackApp(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  إرسال الملاحظة (+10 نقاط)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Survey */}
      {activeSurveyApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2 text-purple-900">
                <Star className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm">استبيان منتصف فترة الاختبار (اليوم 7)</h3>
              </div>
              <button
                onClick={() => setActiveSurveyApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {surveySubmitted ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    شكراً لك! تم استلام إجاباتك بنجاح
                  </h4>
                  <p className="text-xs text-slate-500">
                    تمت إضافة 25 نقطة إلى رصيد نشاطك في المنصة.
                  </p>
                  <button
                    onClick={() => setActiveSurveyApp(null)}
                    className="mt-3 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    إغلاق
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      1. كيف تقيم سرعة التطبيق واستجابته على جهازك؟
                    </label>
                    <div className="flex gap-2">
                      {['ممتاز وسريع', 'جيد جداً', 'متوسط وفيه بطء', 'بطيء جداً'].map((ans) => (
                        <button
                          key={ans}
                          type="button"
                          onClick={() => setSurveyAnswers({ ...surveyAnswers, speed: ans })}
                          className={`flex-1 p-2 rounded-xl text-[11px] font-bold border transition-all ${
                            surveyAnswers.speed === ans
                              ? 'bg-purple-50 border-purple-600 text-purple-800'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      2. هل واجهت أي إغلاق مفاجئ أو تجميد؟
                    </label>
                    <div className="flex gap-2">
                      {['كلا مطلقاً', 'مرة واحدة', 'عدة مرات'].map((ans) => (
                        <button
                          key={ans}
                          type="button"
                          onClick={() => setSurveyAnswers({ ...surveyAnswers, crash: ans })}
                          className={`flex-1 p-2 rounded-xl text-[11px] font-bold border transition-all ${
                            surveyAnswers.crash === ans
                              ? 'bg-purple-50 border-purple-600 text-purple-800'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveSurveyApp(null)}
                      className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurveySubmitted(true)}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                    >
                      إرسال الاستبيان (+25 نقطة)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
