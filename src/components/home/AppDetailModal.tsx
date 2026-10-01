import React, { useState, useEffect } from 'react';
import { AppCampaign } from '../../types';
import { useApp } from '../../context/AppContext';
import { AppIconImage } from '../common/AppIconImage';
import {
  Smartphone,
  Calendar,
  Users,
  Award,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  X,
  Info,
  Check,
} from 'lucide-react';

interface AppDetailModalProps {
  campaign: AppCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessApply?: () => void;
}

const POPULAR_DEVICES = [
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S23 / S22',
  'Google Pixel 8 / 8 Pro',
  'Xiaomi 14 / 13T Pro',
  'OnePlus 12 / 11',
  'iPhone 15 Pro / Max',
  'iPhone 14 / 13',
  'جهاز آخر (سأحدده)',
];

const ANDROID_VERSIONS = ['Android 15 Preview', 'Android 14 (الأحدث)', 'Android 13', 'Android 12', 'Android 11'];
const IOS_VERSIONS = ['iOS 18 (الأحدث)', 'iOS 17.5', 'iOS 16'];

const ARAB_COUNTRIES = [
  'المملكة العربية السعودية',
  'الإمارات العربية المتحدة',
  'مصر',
  'الكويت',
  'قطر',
  'البحرين',
  'سلطنة عمان',
  'الأردن',
  'المغرب',
  'الجزائر',
  'العراق',
  'دولة أخرى',
];

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onSuccessApply,
}) => {
  const { currentTester, applyToCampaign, applications } = useApp();

  const [activeStep, setActiveStep] = useState<'details' | 'apply' | 'success'>('details');

  // Form states
  const [formData, setFormData] = useState({
    name: currentTester.name || '',
    email: currentTester.email || '',
    googlePlayEmail: currentTester.googlePlayGmail || currentTester.email || '',
    country: currentTester.country || 'المملكة العربية السعودية',
    osType: (campaign?.platform === 'ios' ? 'ios' : 'android') as 'android' | 'ios',
    osVersion: campaign?.platform === 'ios' ? 'iOS 18 (الأحدث)' : 'Android 14 (الأحدث)',
    deviceModel: currentTester.deviceModel || 'Samsung Galaxy S24 Ultra',
    customDevice: '',
    agreedToTerms: false,
    agreedToDailyTesting: false,
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Sync with logged in user when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        name: currentTester.name !== 'مستخدم جديد' && currentTester.name !== 'زائر' ? currentTester.name : prev.name,
        email: currentTester.email || prev.email,
        googlePlayEmail: currentTester.googlePlayGmail || currentTester.email || prev.googlePlayEmail,
        agreedToTerms: false,
        agreedToDailyTesting: false,
      }));
    }
  }, [isOpen, currentTester]);

  if (!isOpen || !campaign) return null;

  // Check if tester already applied
  const existingApp = applications.find(
    (a) =>
      a.campaignId === campaign.id &&
      ((currentTester.id !== 'guest' && a.testerId === currentTester.id) ||
        (Boolean(formData.email) && a.testerEmail.toLowerCase() === formData.email.toLowerCase()))
  );

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const resolvedDevice =
      formData.deviceModel === 'جهاز آخر (سأحدده)' && formData.customDevice
        ? formData.customDevice
        : formData.deviceModel;

    setIsSubmitting(true);
    try {
      const res = await applyToCampaign(campaign.id, {
        name: formData.name,
        email: formData.email,
        googlePlayEmail: formData.googlePlayEmail,
        country: formData.country,
        osType: formData.osType,
        osVersion: formData.osVersion,
        deviceModel: resolvedDevice,
      });

      if (res.success) {
        setActiveStep('success');
        if (onSuccessApply) onSuccessApply();
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                campaign.platform === 'android'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : campaign.platform === 'ios'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}
            >
              {campaign.testType === 'google_play_closed'
                ? 'Google Play Closed Testing'
                : campaign.testType === 'testflight'
                ? 'Apple TestFlight'
                : 'اختبار بيتا مغلق'}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              الإصدار: {campaign.version}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeStep === 'details' && (
            <>
              {/* App Hero Summary */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pb-6 border-b border-slate-100">
                <AppIconImage
                  src={campaign.iconUrl}
                  alt={campaign.name}
                  category={campaign.category}
                  appName={campaign.name}
                  platform={campaign.platform}
                  className="w-20 h-20 rounded-2xl shadow-md border border-slate-100 shrink-0"
                />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900">{campaign.name}</h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      بقي {Math.max(0, campaign.requiredTestersCount - campaign.currentTestersCount)} أماكن
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">بواسطة: {campaign.developerName}</p>
                  <p className="text-xs font-semibold text-blue-700 leading-relaxed">
                    {campaign.tagline}
                  </p>
                </div>
              </div>

              {/* Badges Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-[11px] text-slate-500">مدة الاختبار</div>
                  <div className="text-xs font-bold text-slate-900">{campaign.durationDays} يوماً متواصلاً</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-[11px] text-slate-500">المختبرون المطلوبون</div>
                  <div className="text-xs font-bold text-slate-900">{campaign.requiredTestersCount} مختبراً</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Smartphone className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-[11px] text-slate-500">النظام المطلوب</div>
                  <div className="text-xs font-bold text-slate-900">
                    {campaign.platform === 'android' ? 'Android 11+' : 'iOS 16+'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                  <Award className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <div className="text-[11px] text-amber-700 font-medium">المكافأة المخصصة</div>
                  <div className="text-xs font-bold text-amber-900 truncate">
                    {campaign.reward?.value || 'مكافأة معنوية'}
                  </div>
                </div>
              </div>

              {/* Reward Box */}
              {campaign.reward && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 mb-0.5">
                      مكافأة المختبرين: {campaign.reward.title}
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {campaign.reward.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  عن التطبيق وأهداف الاختبار:
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                  {campaign.description}
                </p>
              </div>

              {/* Screenshots Gallery */}
              {campaign.screenshots && campaign.screenshots.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    لقطات شاشة من داخل التطبيق:
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {campaign.screenshots.map((shot, idx) => (
                      <img
                        key={idx}
                        src={shot}
                        alt={`Screenshot ${idx + 1}`}
                        onClick={() => setSelectedScreenshot(shot)}
                        className="w-36 h-52 object-cover rounded-xl border border-slate-200 shrink-0 cursor-pointer shadow-xs hover:scale-102 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Testing Instructions & Tasks Roadmap */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  تعليمات وخارطة مهام الاختبار:
                </h3>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                    {campaign.testingInstructions}
                  </p>

                  <div className="border-t border-slate-200/70 pt-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      المهام المجدولة طوال فترة الـ {campaign.durationDays} يوماً:
                    </span>
                    {campaign.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60"
                      >
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                          اليوم {task.day}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{task.title}</div>
                          <div className="text-[11px] text-slate-500">{task.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Important Closed Testing Notice Box */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  مسار الانضمام (لماذا لا يظهر الرابط فوراً؟):
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  1. تُرسل طلبك مع بريدك الإلكتروني ونوع جهازك. <br />
                  2. يراجع المطور بياناتك ويوافق عليها (تتحول الحالة إلى{' '}
                  <span className="font-bold text-amber-700">Waiting for Whitelisting</span>). <br />
                  3. يضيف المطور بريدك لقائمة Google Play Console أو TestFlight. <br />
                  4. تصبح الحالة <span className="font-bold text-emerald-700">Ready to Join</span>{' '}
                  ويفتح لك زر التحميل والمشاركة فوراً مع إشعار بالبريد!
                </p>
              </div>

              {/* Existing Application Status if already applied */}
              {existingApp && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold">أنت مسجل بالفعل في هذا التطبيق!</div>
                      <div className="text-[11px] text-emerald-700">
                        الحالة الحالية: <span className="font-bold">{existingApp.status}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-lg text-emerald-700 font-bold text-xs hover:bg-emerald-100"
                  >
                    إغلاق
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 2: Application Form */}
          {activeStep === 'apply' && (
            <form onSubmit={handleApply} className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  طلب الانضمام لاختبار: {campaign.name}
                </h3>
                <p className="text-xs text-slate-500">
                  يرجى التأكد من دقة البيانات وخاصة البريد الإلكتروني المربوط بمتجر التطبيقات
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 font-bold">
                  {errorMessage}
                </div>
              )}

              {/* Name & Primary Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.osType === 'android' ? 'بريد Google Play (Gmail) *' : 'حساب Apple ID *'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={
                      formData.osType === 'android' ? 'yourname@gmail.com' : 'appleid@icloud.com'
                    }
                    value={formData.googlePlayEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        googlePlayEmail: e.target.value,
                        email: formData.email || e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formData.osType === 'android'
                      ? 'مهم جداً: هذا البريد سيقوم المطور بإضافته لقائمة Google Play Closed Testing.'
                      : 'البريد المستخدم في تطبيق TestFlight.'}
                  </p>
                </div>
              </div>

              {/* Country Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الدولة *</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  {ARAB_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* OS Selection (Clean options with NO manual typing) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نظام التشغيل على جهازك الأساسي *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={campaign.platform === 'ios'}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          osType: 'android',
                          osVersion: 'Android 14 (الأحدث)',
                        })
                      }
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        formData.osType === 'android'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      } ${campaign.platform === 'ios' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      Android (أندرويد)
                    </button>
                    <button
                      type="button"
                      disabled={campaign.platform === 'android'}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          osType: 'ios',
                          osVersion: 'iOS 18 (الأحدث)',
                        })
                      }
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        formData.osType === 'ios'
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      } ${campaign.platform === 'android' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      iOS (آيفون)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    إصدار النظام (بدون كتابة) *
                  </label>
                  <select
                    value={formData.osVersion}
                    onChange={(e) => setFormData({ ...formData, osVersion: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    {(formData.osType === 'android' ? ANDROID_VERSIONS : IOS_VERSIONS).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Device Model (Fast selection) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  طراز هاتفك الذكي *
                </label>
                <select
                  value={formData.deviceModel}
                  onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white mb-2"
                >
                  {POPULAR_DEVICES.map((dev) => (
                    <option key={dev} value={dev}>
                      {dev}
                    </option>
                  ))}
                </select>

                {formData.deviceModel === 'جهاز آخر (سأحدده)' && (
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسم هاتفك مثلاً: Honor Magic 6 Pro"
                    value={formData.customDevice}
                    onChange={(e) => setFormData({ ...formData, customDevice: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                )}
              </div>

              {/* Terms and Commitments */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreedToDailyTesting}
                    onChange={(e) =>
                      setFormData({ ...formData, agreedToDailyTesting: e.target.checked })
                    }
                    className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    أتعهد بفتح التطبيق يومياً لمدة <strong>{campaign.durationDays} يوماً</strong>{' '}
                    وتنفيذ المهام المطلوبة للمساهمة في نجاح نشر التطبيق على المتجر واستحقاق المكافأة.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreedToTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, agreedToTerms: e.target.checked })
                    }
                    className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    أوافق على سياسة الخصوصية واتفاقية سرية النسخ التجريبية غير المنشورة (NDA).
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep('details')}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  العودة لتفاصيل التطبيق
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? 'جارٍ حفظ الطلب...' : 'تأكيد وإرسال طلب الانضمام'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success Screen */}
          {activeStep === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-xl font-black text-slate-900">
                تم استلام طلبك بنجاح
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                تم إرسال بريدك ({formData.googlePlayEmail}) وبيانات جهازك إلى المطور (
                {campaign.developerName}).
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs max-w-md mx-auto text-right space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  الخطوة التالية
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  سنراجع طلبك، وستصلك الخطوة التالية عند الموافقة. لن يظهر رابط الاختبار قبل اعتماد جاهزية الانضمام.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
                >
                  تم
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (When on details screen) */}
        {activeStep === 'details' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-200/60 transition-colors"
            >
              إغلاق
            </button>

            {existingApp ? (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                عرض حالة طلبي
              </button>
            ) : (
              <button
                onClick={() => setActiveStep('apply')}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                تقديم طلب انضمام للاختبار
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedScreenshot(null)}
        >
          <img
            src={selectedScreenshot}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
