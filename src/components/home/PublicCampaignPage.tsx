import React, { useState } from 'react';
import { AppCampaign } from '../../types';
import { useApp } from '../../context/AppContext';
import { TestFlowLogo } from '../common/TestFlowLogo';
import { AppIconImage } from '../common/AppIconImage';
import {
  Smartphone,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Info,
  Send,
  Mail,
  ExternalLink,
  Star,
} from 'lucide-react';
import { submitTesterRating, submitTesterReport } from '../../lib/publicTesterFeedback';

interface PublicCampaignPageProps {
  campaign: AppCampaign;
  onBackToAll: () => void;
}

const applicationStatusCopy = {
  pending: { title: 'طلبك قيد المراجعة', detail: 'سيراجع صاحب الحملة طلبك قريباً.' },
  accepted: { title: 'تم قبول طلبك', detail: 'يجري تجهيز الوصول إلى الاختبار.' },
  waiting_for_whitelisting: { title: 'يجري إعداد الوصول', detail: 'سيُضاف بريدك إلى قائمة الاختبار قبل إرسال الرابط.' },
  ready_to_join: { title: 'الدعوة جاهزة', detail: 'تحقق من بريدك الإلكتروني للحصول على رابط الاختبار.' },
  joined: { title: 'انضممت إلى الاختبار', detail: 'شكراً لمشاركتك في تجربة التطبيق.' },
  active: { title: 'اختبارك نشط', detail: 'استمر في استخدام التطبيق وفق تعليمات الحملة.' },
  completed: { title: 'اكتمل الاختبار', detail: 'شكراً لإتمامك فترة الاختبار.' },
  inactive: { title: 'الاختبار غير نشط', detail: 'تواصل مع صاحب الحملة إذا احتجت إلى مساعدة.' },
  rejected: { title: 'لم يُقبل الطلب', detail: 'يمكنك استكشاف حملات أخرى متاحة.' },
} as const;

export const PublicCampaignPage: React.FC<PublicCampaignPageProps> = ({
  campaign,
  onBackToAll,
}) => {
  const { applications, currentTester, applyToCampaign } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [reportError, setReportError] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ email: '', target: 'app' as 'app' | 'developer', rating: 5, comment: '' });
  const [reportForm, setReportForm] = useState({ email: '', title: '', description: '', severity: 'medium' as 'low' | 'medium' | 'high' | 'critical' });
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    googlePlayEmail: '',
    country: '',
    osType: (campaign.platform === 'ios' ? 'ios' : 'android') as 'android' | 'ios',
    osVersion: campaign.platform === 'ios' ? 'iOS 18' : 'Android 14',
    deviceModel: '',
    website: '',
  });

  const existingApp = applications.find(
    (a) =>
      a.campaignId === campaign.id &&
      ((currentTester.id !== 'guest' && a.testerId === currentTester.id) ||
        (Boolean(formData.email || currentTester.email) &&
          a.testerEmail.toLowerCase() === (formData.email || currentTester.email).toLowerCase()))
  );
  const applicationStatus = existingApp ? applicationStatusCopy[existingApp.status] : null;
  const requiredFieldsReady = Boolean(formData.name.trim() && formData.email.trim());

  const publicUrl = `${window.location.origin}/campaign/${campaign.slug}`;
  const safeSocialLinks = [
    ['الموقع الإلكتروني', campaign.website],
    ['Instagram', campaign.instagramUrl],
    ['Facebook', campaign.facebookUrl],
    ['X', campaign.xUrl],
  ].filter((item): item is [string, string] => {
    if (typeof item[1] !== 'string') return false;
    try { return new URL(item[1]).protocol === 'https:'; } catch { return false; }
  });
  const applicationStatusGuideUrl = (() => {
    if (!campaign.applicationStatusGuideUrl) return '';
    try { return new URL(campaign.applicationStatusGuideUrl).protocol === 'https:' ? campaign.applicationStatusGuideUrl : ''; } catch { return ''; }
  })();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formData.website) { setIsSubmitted(true); return; }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const result = await applyToCampaign(campaign.id, {
        name: formData.name,
        email: formData.email,
        googlePlayEmail: formData.googlePlayEmail,
        country: formData.country,
        osType: formData.osType,
        osVersion: formData.osVersion,
        deviceModel: formData.deviceModel,
      });
      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackError('');
    setFeedbackBusy(true);
    try {
      await submitTesterRating({ campaignId: campaign.id, ...feedbackForm });
      setFeedbackSent(true);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : 'تعذر إرسال التقييم.');
    } finally {
      setFeedbackBusy(false);
    }
  };

  const handleSubmitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportError('');
    setReportBusy(true);
    try {
      await submitTesterReport({ campaignId: campaign.id, ...reportForm });
      setReportSent(true);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'تعذر إرسال البلاغ.');
    } finally {
      setReportBusy(false);
    }
  };

  const scrollToApplication = () => {
    document.getElementById('campaign-application')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar with back, official logo, and share */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBackToAll}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة
            </button>
            <TestFlowLogo size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              title="نسخ الرابط المستقل لمشاركته في الإعلانات وشبكات التواصل"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط الحملة المستقل'}
            </button>
          </div>
        </div>

        {(campaign.supportEmail || safeSocialLinks.length > 0) && (
          <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <strong className="text-slate-800">تواصل مع المطور:</strong>
            {campaign.supportEmail && <a className="font-semibold text-blue-700" href={`mailto:${campaign.supportEmail}`}><Mail className="inline h-4 w-4" /> {campaign.supportEmail}</a>}
            {safeSocialLinks.map(([label, url]) => (
              <a key={label} className="font-semibold text-blue-700" href={url} target="_blank" rel="noreferrer"><ExternalLink className="inline h-4 w-4" /> {label}</a>
            ))}
          </section>
        )}

        {/* Public Campaign Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-slate-100">
            <AppIconImage
              src={campaign.iconUrl}
              alt={campaign.name}
              category={campaign.category}
              appName={campaign.name}
              platform={campaign.platform}
              className="w-24 h-24 rounded-3xl shadow-lg border border-slate-100 shrink-0"
            />
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {campaign.platform === 'android'
                    ? 'Android'
                    : campaign.platform === 'ios'
                    ? 'iOS'
                    : 'Android & iOS'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  الإصدار: {campaign.version}
                </span>
                <span className="text-xs text-slate-400">• بواسطة: {campaign.developerName}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{campaign.name}</h1>
              <p className="text-sm font-semibold text-blue-700 leading-relaxed">
                {campaign.tagline}
              </p>
            </div>

            {/* Quick Action Button in Hero */}
            <div className="shrink-0 w-full sm:w-auto">
              {existingApp ? (
                <span className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {applicationStatus?.title || 'تم تسجيل طلبك'}
                </span>
              ) : (
                <button
                  onClick={scrollToApplication}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  انضم لاختبار التطبيق الآن
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs text-slate-500">مدة الاختبار</div>
              <div className="text-sm font-bold text-slate-900">{campaign.durationDays} يوماً متواصلاً</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs text-slate-500">الأماكن المتبقية</div>
              <div className="text-sm font-bold text-slate-900">
                {Math.max(0, campaign.requiredTestersCount - campaign.currentTestersCount)} من {campaign.requiredTestersCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <Smartphone className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs text-slate-500">متطلبات النظام</div>
              <div className="text-sm font-bold text-slate-900">{campaign.minOsVersion}</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
              <Award className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <div className="text-xs text-amber-800 font-medium">مكافأة المختبر</div>
              <div className="text-sm font-bold text-amber-950 truncate">
                {campaign.reward?.value || 'مكافأة معنوية'}
              </div>
            </div>
          </div>

          <section className="space-y-3" aria-labelledby="campaign-requirements-heading">
            <h2 id="campaign-requirements-heading" className="text-sm font-bold text-slate-900">متطلبات المشاركة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">إصدار النظام</div>
                <div className="text-xs font-bold text-slate-800">{campaign.minOsVersion}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">الأجهزة والدول المطلوبة</div>
                <div className="text-xs font-bold text-slate-800">
                  {[...campaign.targetDevices, ...campaign.targetCountries].join(' · ') || 'جميع الأجهزة والدول'}
                </div>
              </div>
            </div>
          </section>

          {/* Reward Details Box */}
          {campaign.reward && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-200 flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-500 text-white shrink-0 shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-sm mb-1">
                  المكافأة المخصصة: {campaign.reward.title}
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {campaign.reward.description}
                </p>
              </div>
            </div>
          )}

          {/* App Full Description */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">عن التطبيق وتجربة الاستخدام</h2>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-100">
              {campaign.description}
            </div>
          </div>

          {/* Screenshots Gallery */}
          {campaign.screenshots && campaign.screenshots.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900">لقطات الشاشة (Screenshots)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {campaign.screenshots.map((s, idx) => (
                  <img
                    key={idx}
                    src={s}
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-56 object-cover rounded-2xl border border-slate-200 shadow-xs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tasks Roadmap */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">خطة ومهام الاختبار اليومية</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campaign.tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                      اليوم {task.day}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      +{task.points} نقطة نشاط
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900">{task.title}</div>
                  <div className="text-[11px] text-slate-500">{task.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How joining works info */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-bold">سياسة الخصوصية وسرية النسخة التجريبية:</span>
              <p className="text-[11px] text-blue-800">
                تُستخدم بياناتك لمراجعة طلبك والتواصل بشأن هذه الحملة فقط. يبقى رابط الانضمام مخفيًا حتى تتم الموافقة على الطلب واعتماد جاهزية الوصول.
              </p>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>مضمون بواسطة TestFlow لحماية المختبرين والمطورين</span>
            </div>

            <button
              onClick={scrollToApplication}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              قدّم طلبك الآن
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        <section id="campaign-application" className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs scroll-mt-24">
          {isSubmitted ? (
            <div className="max-w-xl mx-auto py-5 text-center space-y-4" role="status" aria-live="polite">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">تم استلام طلبك بنجاح</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                تم تسجيل طلبك. سيرسل صاحب الحملة رابط الاختبار إلى بريدك عند قبولك؛ وقد لا يعمل الرابط حتى تتم إضافة بريدك إلى قائمة الاختبار أو تأكيد جهوزية الانضمام.
              </p>
              <ol className="grid gap-2 rounded-2xl bg-slate-50 p-4 text-right text-xs text-slate-700 sm:grid-cols-3">
                <li><b className="text-blue-700">1.</b> يراجع صاحب الحملة طلبك</li>
                <li><b className="text-blue-700">2.</b> يضيف بريدك إلى قائمة الاختبار</li>
                <li><b className="text-blue-700">3.</b> يصلك الرابط عبر البريد</li>
              </ol>
              {campaign.applicationStatusGuideName && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-right text-xs text-blue-950">
                <b>متابعة حالة الطلب:</b> {campaign.applicationStatusGuideName}
                {applicationStatusGuideUrl && <a href={applicationStatusGuideUrl} target="_blank" rel="noreferrer" className="mr-2 inline-flex items-center gap-1 font-bold text-blue-700 underline"><ExternalLink className="h-3.5 w-3.5" /> فتح الرابط</a>}
              </div>}
              <button onClick={onBackToAll} className="h-10 px-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
                استكشاف حملات أخرى
              </button>
            </div>
          ) : existingApp ? (
            <div className="py-5 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900">{applicationStatus?.title || 'تم تسجيل طلبك'}</h2>
              <p className="text-xs text-slate-600">{applicationStatus?.detail || 'لا حاجة لإرسال طلب آخر لهذه الحملة.'}</p>
              {campaign.applicationStatusGuideName && <p className="text-xs text-blue-700">لمتابعة الحالة: {campaign.applicationStatusGuideName}{applicationStatusGuideUrl && <> — <a className="font-bold underline" href={applicationStatusGuideUrl} target="_blank" rel="noreferrer">فتح الرابط</a></>}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="max-w-3xl mx-auto space-y-5">
              <div className="rounded-2xl bg-blue-50 p-5 text-center space-y-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">سجّل اهتمامك بالتجربة</h2>
                <p className="text-sm text-slate-600">أدخل اسمك وبريدك فقط، وسنتواصل معك إذا تم قبولك.</p>
                <div className="flex flex-wrap justify-center gap-2 pt-1 text-[11px] font-bold text-blue-800">
                  <span className="rounded-full bg-white px-2.5 py-1">1. بياناتك</span>
                  <span className="rounded-full bg-white px-2.5 py-1">2. مراجعة الطلب</span>
                  <span className="rounded-full bg-white px-2.5 py-1">3. رابط عبر البريد</span>
                </div>
              </div>

              {errorMessage && <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{errorMessage}</div>}
              <label className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
                Website
                <input tabIndex={-1} autoComplete="off" value={formData.website} onChange={(event) => setFormData({ ...formData, website: event.target.value })} />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  الاسم <span className="text-rose-600">*</span>
                  <input required autoComplete="name" placeholder="اكتب اسمك" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full h-11 px-3 rounded-lg border border-slate-200 font-normal focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
                </label>
                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  البريد الإلكتروني <span className="text-rose-600">*</span>
                  <input required type="email" autoComplete="email" placeholder="name@gmail.com" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="w-full h-11 px-3 rounded-lg border border-slate-200 font-normal focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
                </label>
              </div>

              <button type="button" onClick={() => setShowOptionalDetails((visible) => !visible)} className="text-sm font-bold text-blue-700 hover:text-blue-800">
                {showOptionalDetails ? 'إخفاء المعلومات الاختيارية' : 'إضافة معلومات اختيارية تساعدنا في المطابقة'}
              </button>

              {showOptionalDetails && <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  {formData.osType === 'android' ? 'بريد Google Play (اختياري)' : 'بريد Apple ID (اختياري)'}
                  <input type="email" placeholder={formData.osType === 'android' ? 'play-account@gmail.com' : 'apple-id@icloud.com'} value={formData.googlePlayEmail} onChange={(event) => setFormData({ ...formData, googlePlayEmail: event.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 font-normal focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
                </label>
                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  الدولة (اختيارية)
                  <select value={formData.country} onChange={(event) => setFormData({ ...formData, country: event.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white font-normal focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                    <option value="">لا أرغب بتحديد الدولة</option>
                    {campaign.targetCountries.map((country) => <option key={country} value={country}>{country}</option>)}
                    <option value="دولة أخرى">دولة أخرى</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  الجهاز وطرازه (اختياري)
                  <input value={formData.deviceModel} onChange={(event) => setFormData({ ...formData, deviceModel: event.target.value })} placeholder="مثال: Samsung Galaxy S24" className="w-full h-10 px-3 rounded-lg border border-slate-200 font-normal focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
                </label>
                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  نظام التشغيل
                  <select value={formData.osType} onChange={(event) => setFormData({ ...formData, osType: event.target.value as 'android' | 'ios', osVersion: event.target.value === 'ios' ? 'iOS 18' : 'Android 14' })} disabled={campaign.platform !== 'both'} className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white font-normal focus:ring-2 focus:ring-blue-500 focus:outline-hidden">
                    {campaign.platform !== 'ios' && <option value="android">Android</option>}
                    {campaign.platform !== 'android' && <option value="ios">iOS</option>}
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  إصدار النظام (اختياري)
                  <input value={formData.osVersion} onChange={(event) => setFormData({ ...formData, osVersion: event.target.value })} className="w-full h-10 px-3 rounded-lg border border-slate-200 font-normal focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
                </label>
              </div>}

              <p className="text-xs text-slate-500">لن يظهر رابط الاختبار هنا؛ يُرسل فقط إلى البريد بعد قبول الطلب وتجهيز الوصول.</p>
              <button type="submit" disabled={isSubmitting || !requiredFieldsReady} className="h-11 w-full sm:w-auto px-6 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-bold flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                {isSubmitting ? 'جارٍ تسجيل طلبك...' : 'تسجيل اهتمامي'}
              </button>
            </form>
          )}
        </section>

        {!existingApp && !isSubmitted && (
          <div className="fixed inset-x-4 bottom-4 z-20 sm:hidden">
            <button onClick={scrollToApplication} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-900/20">
              <Send className="h-4 w-4" /> سجّل اهتمامك بالتجربة
            </button>
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={handleSubmitFeedback} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-black text-slate-900"><Star className="inline h-4 w-4 text-amber-500" /> قيّم التجربة</h2>
            <p className="text-xs text-slate-600">متاح بعد قبول طلبك. لا تحتاج إلى تسجيل دخول؛ استخدم البريد نفسه الذي سجلت به.</p>
            {feedbackError && <p role="alert" className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{feedbackError}</p>}
            {feedbackSent ? <p role="status" className="text-sm font-bold text-emerald-700">شكراً لك، تم استلام تقييمك.</p> : <>
              <label className="block space-y-1 text-xs font-bold">بريد التسجيل
                <input required type="email" autoComplete="email" value={feedbackForm.email} onChange={(event) => setFeedbackForm({ ...feedbackForm, email: event.target.value })} className="w-full rounded-lg border p-2 font-normal" />
              </label>
              <label className="block space-y-1 text-xs font-bold">ما الذي تريد تقييمه؟
                <select value={feedbackForm.target} onChange={(event) => setFeedbackForm({ ...feedbackForm, target: event.target.value as 'app' | 'developer' })} className="w-full rounded-lg border bg-white p-2 font-normal">
                  <option value="app">التطبيق</option><option value="developer">المطور</option>
                </select>
              </label>
              <label className="block space-y-1 text-xs font-bold">التقييم
                <select value={feedbackForm.rating} onChange={(event) => setFeedbackForm({ ...feedbackForm, rating: Number(event.target.value) })} className="w-full rounded-lg border bg-white p-2 font-normal">
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{'★'.repeat(rating)} ({rating}/5)</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-xs font-bold">تعليق (اختياري)
                <textarea maxLength={2000} value={feedbackForm.comment} onChange={(event) => setFeedbackForm({ ...feedbackForm, comment: event.target.value })} className="min-h-20 w-full rounded-lg border p-2 font-normal" />
              </label>
              <button disabled={feedbackBusy} className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">{feedbackBusy ? 'جارٍ الإرسال…' : 'إرسال التقييم'}</button>
            </>}
          </form>

          <form onSubmit={handleSubmitReport} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-black text-slate-900">إبلاغ إدارة TestFlow</h2>
            <p className="text-xs text-slate-600">أرسل بلاغاً للإدارة عن مشكلة أو سلوك غير مناسب. يلزم قبول طلبك لهذه الحملة.</p>
            {reportError && <p role="alert" className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{reportError}</p>}
            {reportSent ? <p role="status" className="text-sm font-bold text-emerald-700">تم استلام بلاغك وستراجعه الإدارة.</p> : <>
              <label className="block space-y-1 text-xs font-bold">بريد التسجيل
                <input required type="email" autoComplete="email" value={reportForm.email} onChange={(event) => setReportForm({ ...reportForm, email: event.target.value })} className="w-full rounded-lg border p-2 font-normal" />
              </label>
              <label className="block space-y-1 text-xs font-bold">عنوان البلاغ
                <input required maxLength={160} value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })} className="w-full rounded-lg border p-2 font-normal" />
              </label>
              <label className="block space-y-1 text-xs font-bold">التفاصيل
                <textarea required maxLength={3000} value={reportForm.description} onChange={(event) => setReportForm({ ...reportForm, description: event.target.value })} className="min-h-20 w-full rounded-lg border p-2 font-normal" />
              </label>
              <label className="block space-y-1 text-xs font-bold">الأهمية
                <select value={reportForm.severity} onChange={(event) => setReportForm({ ...reportForm, severity: event.target.value as typeof reportForm.severity })} className="w-full rounded-lg border bg-white p-2 font-normal">
                  <option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option><option value="critical">عاجلة</option>
                </select>
              </label>
              <button disabled={reportBusy} className="rounded-lg bg-rose-700 px-4 py-2 font-bold text-white disabled:opacity-50">{reportBusy ? 'جارٍ الإرسال…' : 'إرسال البلاغ للإدارة'}</button>
            </>}
          </form>
        </section>
      </div>
    </div>
  );
};
