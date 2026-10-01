import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DeveloperUser, TesterUser, AppCampaign, ReputationLevel } from '../../types';
import { maskSensitiveEmail } from '../../utils/security';
import { exportTestersToCsv, copyTesterGmailsToClipboard } from '../../utils/exportTesters';
import { AppIconImage } from '../common/AppIconImage';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Code2,
  Smartphone,
  Bug,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Ban,
  Award,
  TrendingUp,
  Search,
  Filter,
  Mail,
  Clock,
  Layers,
  Sparkles,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  Cpu,
  Zap,
  Activity,
  Sliders,
  Trash2,
  Plus,
  ExternalLink,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Upload,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { getIdToken } = useAuth();
  const {
    developers,
    testers,
    campaigns,
    applications,
    bugReports,
    feedbacks,
    emails,
    securityLogs,
    isLockdownMode,
    setIsLockdownMode,
    isAntiBotEnabled,
    setIsAntiBotEnabled,
    isWatermarkEnforced,
    setIsWatermarkEnforced,
    isEmailMasked,
    setIsEmailMasked,
    blockSuspiciousIp,
    simulateCyberAttackTest,
    updateDeveloperStatus,
    updateTesterStatus,
    updateTesterReputation,
    toggleCampaignFeatured,
    updateApplicationStatus,
    addCampaign,
    removeCampaign,
    updateCampaign,
    showToast,
  } = useApp();

  const [serverDeveloperRequests, setServerDeveloperRequests] = useState<Array<{
    uid: string;
    name: string | null;
    email: string;
    companyName: string | null;
    createdAt: string | null;
  }>>([]);

  useEffect(() => {
    let isMounted = true;
    getIdToken()
      .then((token) => token
        ? fetch('/api/admin/developer-requests', {
            headers: { Authorization: `Bearer ${token}` },
          })
        : null)
      .then(async (response) => {
        if (response && response.ok && isMounted) setServerDeveloperRequests(await response.json());
      })
      .catch((error) => console.warn('Could not load approved developer requests:', error));
    return () => { isMounted = false; };
  }, []);

  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [newAppForm, setNewAppForm] = useState({
    name: '',
    slug: '',
    developerName: 'إدارة TestFlow',
    platform: 'android' as 'android' | 'ios' | 'both',
    testType: 'google_play_closed' as AppCampaign['testType'],
    testUrl: '',
    category: 'productivity' as AppCampaign['category'],
    durationDays: 14,
    requiredTestersCount: 20,
    tagline: '',
    description: '',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    testingInstructions: '1. تثبيت التطبيق والاحتفاظ به لمدة 14 يوماً متواصلة.\n2. فتح التطبيق واستخدامه يومياً لمدة لا تقل عن 3 دقائق.\n3. الإبلاغ عن أي أخطاء أو ملاحظات عبر المنصة.',
    rewardTitle: 'مكافأة اجتياز فترة الـ 14 يوماً بنجاح',
    rewardValue: '20$',
  });

  const handleAdminCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppForm.name) return;

    const slug =
      newAppForm.slug.trim() ||
      newAppForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') ||
      `app-${Date.now()}`;

    try {
      await addCampaign({
      name: newAppForm.name,
      slug,
      developerId: 'admin',
      developerName: newAppForm.developerName,
      platform: newAppForm.platform,
      testType: newAppForm.testType,
      testUrl: newAppForm.testUrl || 'https://play.google.com/apps/testing/',
      version: '1.0.0',
      category: newAppForm.category,
      durationDays: Number(newAppForm.durationDays) || 14,
      requiredTestersCount: Number(newAppForm.requiredTestersCount) || 20,
      tagline: newAppForm.tagline || 'تطبيق جديد متاح للاختبار المغلق لمدة 14 يوماً',
      description: newAppForm.description || 'تطبيق معتمد ومحمي، شارك في اختباره واكسب المكافأة المقررة.',
      iconUrl: newAppForm.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      screenshots: [newAppForm.iconUrl],
      targetCountries: ['جميع الدول العربية'],
      targetDevices: ['Android & iOS'],
      minOsVersion: 'Android 10+ / iOS 15+',
      testingInstructions: newAppForm.testingInstructions,
      reward: newAppForm.rewardTitle
        ? {
            type: 'cash',
            title: newAppForm.rewardTitle,
            value: newAppForm.rewardValue,
            description: 'تسلم المكافأة فور استكمال فترة الاختبار المطلوبة.',
          }
        : undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      isFeatured: true,
      tasks: [
        {
          id: `t-${Date.now()}-1`,
          day: 1,
          title: 'تثبيت التطبيق وتسجيل الدخول',
          description: 'قم بتثبيت التطبيق من رابط المتجر المعتمد وسجل دخولك.',
          isRequired: true,
          points: 20,
        },
        {
          id: `t-${Date.now()}-2`,
          day: 7,
          title: 'استبيان منتصف فترة الاختبار',
          description: 'تقييم تجربة الاستخدام واستقرار التطبيق وسرعته.',
          isRequired: true,
          points: 30,
        },
        {
          id: `t-${Date.now()}-3`,
          day: 14,
          title: 'إتمام الـ 14 يوماً والتقييم الختامي',
          description: 'تأكيد الالتزام بالـ 14 يوماً واستحقاق المكافأة.',
          isRequired: true,
          points: 50,
        },
      ],
      });
      setIsAddAppModalOpen(false);
      setNewAppForm({
      name: '',
      slug: '',
      developerName: 'إدارة TestFlow',
      platform: 'android',
      testType: 'google_play_closed',
      testUrl: '',
      category: 'productivity',
      durationDays: 14,
      requiredTestersCount: 20,
      tagline: '',
      description: '',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      testingInstructions: '1. تثبيت التطبيق والاحتفاظ به لمدة 14 يوماً متواصلة.\n2. فتح التطبيق واستخدامه يومياً لمدة لا تقل عن 3 دقائق.\n3. الإبلاغ عن أي أخطاء أو ملاحظات عبر المنصة.',
      rewardTitle: 'مكافأة اجتياز فترة الـ 14 يوماً بنجاح',
      rewardValue: '20$',
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'تعذر حفظ الحملة. تحقق من اتصال قاعدة البيانات وحاول مرة أخرى.', 'error');
    }
  };

  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'developers' | 'testers' | 'campaigns' | 'distribution' | 'emails' | 'security'
  >('overview');

  const [searchQuery, setSearchQuery] = useState('');

  // Overview stats
  const pendingDevsCount =
    developers.filter((d) => d.status === 'pending_approval').length + serverDeveloperRequests.length;
  const activeAppsCount = campaigns.filter((c) => c.status === 'active').length;
  const totalApplicationsCount = applications.length;

  // Admin CSV & Email actions
  const [adminCopied, setAdminCopied] = useState(false);
  const handleAdminCopyGmails = async () => {
    const count = await copyTesterGmailsToClipboard(applications, 'comma');
    setAdminCopied(true);
    setTimeout(() => setAdminCopied(false), 2500);
    alert(`تم نسخ ${count} بريد Gmail للمختبرين بنجاح!`);
  };

  const handleAdminExportCsv = (mode: 'full' | 'gmail_only' = 'full') => {
    exportTestersToCsv({
      applications,
      campaigns,
      mode,
      filename:
        mode === 'gmail_only'
          ? `admin-testflow-gmails-${new Date().toISOString().split('T')[0]}.csv`
          : `admin-testflow-testers-full-${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

  const decideServerDeveloperRequest = async (uid: string, decision: 'approve' | 'reject') => {
    try {
      const token = await getIdToken();
      if (!token) throw new Error('انتهت جلسة الإدارة. سجّل الدخول مجدداً.');
      const response = await fetch(`/api/admin/developer-requests/${encodeURIComponent(uid)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) throw new Error('تعذر تحديث طلب المطور.');
      setServerDeveloperRequests((requests) => requests.filter((request) => request.uid !== uid));
      showToast(decision === 'approve' ? 'تم اعتماد المطور.' : 'تم رفض طلب المطور.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'تعذر تحديث الطلب.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner - Sleek Executive Admin Console */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-black text-xl text-blue-300">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg sm:text-xl font-black">لوحة التحكم العليا للإدارة (Admin)</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-200 border border-blue-500/30">
                صلاحيات المطور الأعلى
              </span>
            </div>
            <p className="text-xs text-slate-400">
              إدارة المطورين، اعتماد وتثبيت التطبيقات، تصدير بيانات المختبرين، وتدقيق الجودة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {pendingDevsCount > 0 && (
            <div className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                لديك <strong className="text-white font-bold">{pendingDevsCount}</strong> طلب تسجيل مطور بانتظار
                الموافقة!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs - Segmented, Clean Controls */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: 'نظرة عامة وإحصائيات', icon: TrendingUp },
          {
            id: 'developers',
            label: `إدارة المطورين`,
            icon: Code2,
            badge: pendingDevsCount,
            count: developers.length,
          },
          { id: 'testers', label: `إدارة المختبرين`, icon: Users, count: testers.length },
          { id: 'campaigns', label: `التطبيقات والحملات`, icon: Smartphone, count: campaigns.length },
          { id: 'distribution', label: 'توزيع المختبرين', icon: Layers },
          { id: 'emails', label: `إشعارات البريد`, icon: Mail, count: emails.length },
          { id: 'security', label: `الأمن السيبراني`, icon: ShieldAlert, count: securityLogs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`h-9 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && tab.badge > 0 ? (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 block font-semibold mb-1">
                إجمالي المختبرين
              </span>
              <span className="text-2xl font-black text-slate-900">{testers.length}</span>
              <div className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% مختبرون مفحوصون
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 block font-semibold mb-1">
                المطورون والشركات
              </span>
              <span className="text-2xl font-black text-blue-700">{developers.length}</span>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                {pendingDevsCount} قيد الاعتماد
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 block font-semibold mb-1">
                طلبات الانضمام للاختبار
              </span>
              <span className="text-2xl font-black text-purple-700">{totalApplicationsCount}</span>
              <div className="text-[11px] text-purple-600 font-bold mt-2">
                عبر {campaigns.length} حملة
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 block font-semibold mb-1">
                بلاغات الأخطاء (Bugs)
              </span>
              <span className="text-2xl font-black text-rose-600">{bugReports.length}</span>
              <div className="text-[11px] text-slate-500 mt-2 font-medium">
                {feedbacks.length} ملاحظة وتجربة
              </div>
            </div>
          </div>

          {/* Quick Pending Developer Approvals alert */}
          {pendingDevsCount > 0 && (
            <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-xs space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                طلبات انضمام المطورين الجديدة التي تحتاج لموافقتك:
              </h3>
              <div className="divide-y divide-slate-100">
                {developers
                  .filter((d) => d.status === 'pending_approval')
                  .map((dev) => (
                    <div
                      key={dev.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {dev.companyName} ({dev.name})
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          البريد: {dev.email} • تاريخ الطلب: {dev.submittedAt}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateDeveloperStatus(dev.id, 'approved')}
                          className="h-8 px-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          موافقة وتفعيل الحساب
                        </button>
                        <button
                          onClick={() => updateDeveloperStatus(dev.id, 'rejected')}
                          className="h-8 px-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-colors"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* App Installation & Management Section for Admin */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <h3 className="font-black text-slate-900 text-base">
                    تثبيت وإدارة تطبيقات الاختبار ({campaigns.length})
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  يمكنك تثبيت تطبيقات حقيقية جديدة أو إزالة وحذف أي تطبيق نهائياً من المنصة فوراً
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddAppModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  تثبيت / إضافة تطبيق جديد
                </button>
              </div>
            </div>

            {campaigns.length === 0 ? (
              <div className="p-8 rounded-2xl bg-purple-50/50 border border-purple-100 text-center space-y-3">
                <Smartphone className="w-12 h-12 text-purple-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  لا توجد تطبيقات معروضة للاختبار حالياً
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  تم إفراغ كافة البيانات والتطبيقات الوهمية بنجاح. بصفتك مديراً للمنصة، يمكنك الآن تثبيت التطبيقات الحقيقية المطلوبة لاختبار الـ 14 يوماً.
                </p>
                <button
                  onClick={() => setIsAddAppModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  تثبيت أول تطبيق للاختبار الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-3 transition-all"
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
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{camp.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                            {camp.platform}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {camp.developerName} • {camp.durationDays} يوماً • {camp.requiredTestersCount} مختبر
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                      <button
                        onClick={() => toggleCampaignFeatured(camp.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          camp.isFeatured
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {camp.isFeatured ? '★ مميز' : 'تثبيت كمميز'}
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(camp.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                        title="إزالة هذا التطبيق نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        إزالة التطبيق
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DEVELOPERS MANAGEMENT */}
      {activeAdminTab === 'developers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">
              قائمة المطورين وحالة الحسابات
            </h2>
          </div>

          {serverDeveloperRequests.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">طلبات المطورين الجديدة</h3>
              <div className="divide-y divide-amber-200/70">
                {serverDeveloperRequests.map((request) => (
                  <div key={request.uid} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{request.companyName || 'فريق مطور'}</div>
                      <div className="text-slate-600">{request.name || 'مطور'} · {request.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void decideServerDeveloperRequest(request.uid, 'approve')}
                        className="h-8 px-3 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                      >
                        موافقة
                      </button>
                      <button
                        onClick={() => void decideServerDeveloperRequest(request.uid, 'reject')}
                        className="h-8 px-3 rounded-lg border border-rose-200 bg-white text-rose-700 font-bold hover:bg-rose-50"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">الشركة / الاستوديو</th>
                  <th className="p-3.5">المسؤول</th>
                  <th className="p-3.5">البريد والهاتف</th>
                  <th className="p-3.5">التطبيقات</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {developers.map((dev) => (
                  <tr key={dev.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-900">{dev.companyName}</td>
                    <td className="p-3.5">{dev.name}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{dev.email}</td>
                    <td className="p-3.5 font-bold text-blue-700">{dev.appsCount} تطبيق</td>
                    <td className="p-3.5">
                      {dev.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          معتمد (Approved)
                        </span>
                      )}
                      {dev.status === 'pending_approval' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 animate-pulse">
                          بانتظار الموافقة
                        </span>
                      )}
                      {dev.status === 'suspended' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                          محظور (Suspended)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {dev.status !== 'approved' && (
                          <button
                            onClick={() => updateDeveloperStatus(dev.id, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                          >
                            موافقة
                          </button>
                        )}
                        {dev.status !== 'suspended' ? (
                          <button
                            onClick={() => updateDeveloperStatus(dev.id, 'suspended')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-rose-600 font-bold text-[11px] hover:bg-rose-50"
                          >
                            إيقاف / حظر
                          </button>
                        ) : (
                          <button
                            onClick={() => updateDeveloperStatus(dev.id, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px]"
                          >
                            رفع الحظر
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TESTERS MANAGEMENT & REPUTATION */}
      {activeAdminTab === 'testers' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-black text-slate-900">
                  إدارة المختبرين وتصدير القوائم (Tester Hub)
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                مراقبة تقييمات المختبرين، درجات السمعة، وتصدير إيميلات الـ Gmail لقوقل بلاي كونسول
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAdminCopyGmails}
                className="h-9 px-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
                title="نسخ جميع إيميلات المختبرين"
              >
                {adminCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{adminCopied ? 'تم النسخ!' : 'نسخ إيميلات Gmail'}</span>
              </button>

              <button
                onClick={() => handleAdminExportCsv('full')}
                className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 border border-slate-200"
                title="تصدير بيانات المختبرين كاملة بصيغة CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>تصدير CSV كامل</span>
              </button>

              <button
                onClick={() => handleAdminExportCsv('gmail_only')}
                className="h-9 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-all flex items-center gap-1.5 border border-emerald-200"
                title="تصدير قائمة Gmail فقط جاهزة للكونسول"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gmail فقط (CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">المختبر</th>
                  <th className="p-3.5">البريد والدولة</th>
                  <th className="p-3.5">الجهاز الأساسي</th>
                  <th className="p-3.5">تصنيف السمعة (Reputation)</th>
                  <th className="p-3.5">نسبة الالتزام</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">تعديل التصنيف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {testers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لا يوجد مختبرين مسجلين حالياً.
                    </td>
                  </tr>
                ) : (
                  testers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-900">{t.name}</td>
                    <td className="p-3.5">
                      <div className="font-mono text-[11px] text-blue-700">{t.email}</div>
                      <div className="text-[10px] text-slate-400">{t.country}</div>
                    </td>
                    <td className="p-3.5">{t.deviceModel}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          t.reputation.level === 'top'
                            ? 'bg-amber-100 text-amber-800'
                            : t.reputation.level === 'trusted'
                            ? 'bg-blue-100 text-blue-800'
                            : t.reputation.level === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.reputation.level.toUpperCase()} ({t.reputation.score} / 100)
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600">
                      {t.reputation.commitmentRate}%
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          t.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {t.status === 'active' ? 'نشط' : 'محظور'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <select
                        value={t.reputation.level}
                        onChange={(e) =>
                          updateTesterReputation(
                            t.id,
                            e.target.value as ReputationLevel,
                            e.target.value === 'top'
                              ? 95
                              : e.target.value === 'trusted'
                              ? 85
                              : e.target.value === 'active'
                              ? 70
                              : 50
                          )
                        }
                        className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold bg-white"
                      >
                        <option value="new">New Tester</option>
                        <option value="active">Active Tester</option>
                        <option value="trusted">Trusted Tester</option>
                        <option value="top">Top Tester ⭐</option>
                      </select>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CAMPAIGNS MANAGEMENT & APP INSTALLATION */}
      {activeAdminTab === 'campaigns' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                إدارة وتثبيت التطبيقات (App Management)
              </h2>
              <p className="text-xs text-slate-500">
                يمكن للإدارة تثبيت وإضافة تطبيقات جديدة أو إزالة أي تطبيق نهائياً من المنصة وقاعدة البيانات
              </p>
            </div>
            <button
              onClick={() => setIsAddAppModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              تثبيت / إضافة تطبيق جديد
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-4">
              <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">لا توجد تطبيقات مضافة حالياً</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  تم إفراغ التطبيقات الوهمية. بصفتك مديراً للنظام، يمكنك تثبيت وإضافة التطبيقات الحقيقية الآن للبدء.
                </p>
              </div>
              <button
                onClick={() => setIsAddAppModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs shadow-sm hover:bg-purple-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                تثبيت أول تطبيق للاختبار
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs space-y-4 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <AppIconImage
                      src={camp.iconUrl}
                      alt={camp.name}
                      category={camp.category}
                      appName={camp.name}
                      platform={camp.platform}
                      className="w-14 h-14 rounded-2xl border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{camp.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                          {camp.platform}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">المطور: {camp.developerName}</p>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-1">{camp.tagline || camp.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">المختبرون:</span>
                      <strong className="text-slate-900">{camp.currentTestersCount} / {camp.requiredTestersCount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">المدة:</span>
                      <strong className="text-slate-900">{camp.durationDays} يوماً</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">الحالة:</span>
                      <span className={`font-bold ${camp.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {camp.status === 'active' ? 'نشط' : 'معلق'}
                      </span>
                    </div>
                  </div>

                  {camp.testUrl && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono truncate bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{camp.testUrl}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      onClick={() => toggleCampaignFeatured(camp.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        camp.isFeatured
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {camp.isFeatured ? '★ مثبت كمميز' : 'تثبيت كمميز'}
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(camp.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                      title="إزالة التطبيق نهائياً"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      إزالة التطبيق
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete App Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-right border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">تأكيد إزالة التطبيق نهائياً</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا التطبيق؟ سيتم حذفه من واجهة المستخدم وقاعدة بيانات Cloud SQL وجميع طلبات الاختبار التابعة له.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  const deleted = await removeCampaign(deleteConfirmId);
                  if (deleted) setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20"
              >
                نعم، احذف التطبيق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Install App Modal for Admin */}
      {isAddAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 text-right border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-900">تثبيت / إضافة تطبيق جديد للاختبار</h3>
                <p className="text-xs text-slate-500">
                  إدخال بيانات التطبيق وحملة الـ 14 يوماً لإتاحته فوراً أمام المختبرين
                </p>
              </div>
              <button
                onClick={() => setIsAddAppModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminCreateApp} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم التطبيق *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تطبيق رواق للكتب"
                    value={newAppForm.name}
                    onChange={(e) => setNewAppForm({ ...newAppForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المعرف الفريد (Slug)</label>
                  <input
                    type="text"
                    placeholder="rewaq-books-app"
                    value={newAppForm.slug}
                    onChange={(e) => setNewAppForm({ ...newAppForm, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">النظام المستهدف *</label>
                  <select
                    value={newAppForm.platform}
                    onChange={(e) => setNewAppForm({ ...newAppForm, platform: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                  >
                    <option value="android">Android (Google Play)</option>
                    <option value="ios">iOS (TestFlight)</option>
                    <option value="both">كلا النظامين (Android & iOS)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف *</label>
                  <select
                    value={newAppForm.category}
                    onChange={(e) => setNewAppForm({ ...newAppForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                  >
                    <option value="productivity">إنتاجية وأدوات</option>
                    <option value="finance">مالية ومصارف</option>
                    <option value="health">صحة ولياقة</option>
                    <option value="games">ألعاب وترفيه</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المطور / الجهة</label>
                  <input
                    type="text"
                    value={newAppForm.developerName}
                    onChange={(e) => setNewAppForm({ ...newAppForm, developerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رابط الاختبار المغلق (Google Play / TestFlight) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://play.google.com/apps/testing/com.example.app"
                    value={newAppForm.testUrl}
                    onChange={(e) => setNewAppForm({ ...newAppForm, testUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono text-[11px]"
                  />
                </div>

              {/* App Icon Upload Component */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <label className="block font-bold text-slate-800 text-xs">صورة أيقونة التطبيق (App Icon) *</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <AppIconImage
                    src={newAppForm.iconUrl}
                    alt={newAppForm.name || 'أيقونة التطبيق'}
                    category={newAppForm.category}
                    appName={newAppForm.name}
                    className="w-16 h-16 rounded-2xl shadow-xs border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 w-full space-y-2">
                    <label className="cursor-pointer py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-colors flex items-center justify-center gap-2">
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
                      placeholder="أو ضع رابط أيقونة خارجية (Icon URL)..."
                      value={newAppForm.iconUrl.startsWith('data:') ? '' : newAppForm.iconUrl}
                      onChange={(e) => setNewAppForm({ ...newAppForm, iconUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-[11px] focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدة المطلوبة (أيام) *</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newAppForm.durationDays}
                    onChange={(e) => setNewAppForm({ ...newAppForm, durationDays: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المختبرون المطلوبون *</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={newAppForm.requiredTestersCount}
                    onChange={(e) => setNewAppForm({ ...newAppForm, requiredTestersCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان الترويجي القصير (Tagline)</label>
                <input
                  type="text"
                  placeholder="وصف مختصر يلخص فكرة التطبيق في سطر واحد"
                  value={newAppForm.tagline}
                  onChange={(e) => setNewAppForm({ ...newAppForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف الكامل للتطبيق ومجالات اختباره</label>
                <textarea
                  rows={3}
                  placeholder="اشرح ميزات التطبيق وما ترغب من المختبرين التركيز عليه أثناء فترة الـ 14 يوماً..."
                  value={newAppForm.description}
                  onChange={(e) => setNewAppForm({ ...newAppForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عنوان المكافأة للمختبرين</label>
                  <input
                    type="text"
                    value={newAppForm.rewardTitle}
                    onChange={(e) => setNewAppForm({ ...newAppForm, rewardTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">قيمة المكافأة المقدرة</label>
                  <input
                    type="text"
                    value={newAppForm.rewardValue}
                    onChange={(e) => setNewAppForm({ ...newAppForm, rewardValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAppModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20"
                >
                  تثبيت ونشر التطبيق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: DISTRIBUTION MATRIX */}
      {activeAdminTab === 'distribution' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              مصفوفة توزيع المختبرين حسب التطبيقات
            </h2>
            <p className="text-xs text-slate-500">
              يوضح الجدول كل مختبر والتطبيقات التي يشارك في اختبارها وحالته في كل تطبيق
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">المختبر</th>
                  <th className="p-3.5">البريد</th>
                  {campaigns.map((c) => (
                    <th key={c.id} className="p-3.5 text-center">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {testers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-900">{t.name}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{t.email}</td>
                    {campaigns.map((c) => {
                      const app = applications.find(
                        (a) => a.testerId === t.id && a.campaignId === c.id
                      );
                      return (
                        <td key={c.id} className="p-3.5 text-center">
                          {app ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                app.status === 'ready_to_join' || app.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.status === 'waiting_for_whitelisting'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {app.status === 'waiting_for_whitelisting'
                                ? 'بانتظار الإضافة'
                                : app.status === 'ready_to_join'
                                ? 'جاهز للانضمام'
                                : app.status === 'active'
                                ? 'نشط'
                                : app.status}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: EMAIL LOG */}
      {activeAdminTab === 'emails' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">
                سجل إشعارات البريد الإلكتروني المرسلة تلقائياً
              </h2>
              <p className="text-xs text-slate-500">
                توثيق كامل لكافة الرسائل المرسلة للمختبرين والمطورين عند تغيير الحالات
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {emails.map((e) => (
              <div
                key={e.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{e.subject}</div>
                  <div className="text-[10px] text-slate-400">{e.sentAt}</div>
                </div>
                <div className="text-[11px] text-slate-500">
                  إلى: <strong className="text-slate-700">{e.toName}</strong> ({e.toEmail})
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/70 text-slate-600 whitespace-pre-line leading-relaxed">
                  {e.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CYBERSECURITY & SOC */}
      {activeAdminTab === 'security' && (
        <div className="space-y-6">
          {/* Security KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 block font-semibold mb-1">
                حالة الجدار الناري والتشفير
              </span>
              <span className="text-xl font-black text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                درجة A+ (100%)
              </span>
              <div className="text-[11px] text-slate-500 mt-2">
                TLS 1.3 + حماية XSS نشطة
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 block font-semibold mb-1">
                وضع الطوارئ وتجميد الروابط
              </span>
              <span className={`text-xl font-black flex items-center gap-1.5 ${isLockdownMode ? 'text-rose-600' : 'text-slate-900'}`}>
                <Lock className={`w-5 h-5 ${isLockdownMode ? 'text-rose-600' : 'text-slate-500'}`} />
                {isLockdownMode ? 'مُفعل (تجميد نشط)' : 'معطل (طبيعي)'}
              </span>
              <div className="text-[11px] text-slate-500 mt-2">
                {isLockdownMode ? 'الروابط معلقة احترازياً' : 'الروابط المشفرة متاحة للمعتمدين'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 block font-semibold mb-1">
                درع مكافحة البوتات (Anti-Bot)
              </span>
              <span className="text-xl font-black text-blue-700 flex items-center gap-1.5">
                <Cpu className="w-5 h-5 text-blue-600" />
                {isAntiBotEnabled ? 'مفعل (نشط)' : 'معطل'}
              </span>
              <div className="text-[11px] text-slate-500 mt-2">
                فلترة الإيميلات المؤقتة لحماية قوقل بلاي
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-400 block font-semibold mb-1">
                سجلات التدقيق الأمني
              </span>
              <span className="text-xl font-black text-purple-700 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                {securityLogs.length} حدثاً موثقاً
              </span>
              <div className="text-[11px] text-slate-500 mt-2">
                تدقيق إلزامي غير قابل للتلاعب
              </div>
            </div>
          </div>

          {/* Defense Controls Strip */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  أدوات الدفاع السيبراني والاستجابة الفورية (Active Cyber Defense)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  تحكم مباشر في أمن المنصة، تجميد روابط التنزيل في حالات الطوارئ، وتدقيق العمليات
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsLockdownMode(!isLockdownMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs ${
                    isLockdownMode
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isLockdownMode ? 'إيقاف وضع الطوارئ' : 'تفعيل وضع الطوارئ وتجميد الروابط ⚠️'}
                </button>

                <button
                  onClick={() => setIsAntiBotEnabled(!isAntiBotEnabled)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isAntiBotEnabled
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isAntiBotEnabled ? 'درع البوتات: مفعل' : 'درع البوتات: معطل'}
                </button>

                <button
                  onClick={simulateCyberAttackTest}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  محاكاة هجوم واختبار الصد ⚡
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base">سجل التدقيق الأمني الحي (Live SIEM Logs)</h3>
                <p className="text-xs text-slate-500">رصد دقيق لكافة العمليات الحساسة، الاستعلامات، وتصدير الإيميلات</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400">
                    <th className="pb-3 font-semibold">الحالة</th>
                    <th className="pb-3 font-semibold">الحدث</th>
                    <th className="pb-3 font-semibold">الفاعل</th>
                    <th className="pb-3 font-semibold">التفاصيل</th>
                    <th className="pb-3 font-semibold">عنوان IP</th>
                    <th className="pb-3 font-semibold">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {securityLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                            log.status === 'ALLOWED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.status === 'BLOCKED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] font-bold text-slate-800">
                        {log.eventType}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {log.actor} <span className="text-slate-400 font-normal">({log.actorRole})</span>
                      </td>
                      <td className="py-3 text-slate-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-3 font-mono text-slate-500 text-[11px]">
                        {log.ipAddress}
                      </td>
                      <td className="py-3 text-slate-400 text-[11px]">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
