import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppCampaign } from '../../types';
import { AppIconImage } from '../common/AppIconImage';
import {
  Smartphone,
  Apple,
  Search,
  Filter,
  Award,
  Clock,
  Users,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface HomeViewProps {
  onSelectCampaign: (campaign: AppCampaign) => void;
  onOpenCampaign: (slug: string) => void;
  onOpenHowItWorks: () => void;
  onOpenDevRegister: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectCampaign,
  onOpenCampaign,
  onOpenHowItWorks,
  onOpenDevRegister,
}) => {
  const { campaigns, applications, currentTester, setSelectedCampaignSlug } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'android' | 'ios'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rewardOnly, setRewardOnly] = useState(false);
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState('all');

  // Categories list
  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'productivity', label: 'إنتاجية وأدوات' },
    { id: 'finance', label: 'مالية ومصارف' },
    { id: 'health', label: 'صحة ولياقة' },
    { id: 'games', label: 'ألعاب وترفيه' },
  ];
  const availableCountries = Array.from(new Set(campaigns.flatMap((campaign) => campaign.targetCountries || [])))
    .filter((country) => country && country !== 'جميع الدول العربية');

  // Filtering
  const filteredCampaigns = campaigns.filter((camp) => {
    if (camp.status !== 'active') return false;

    // Platform
    if (platformFilter === 'android' && camp.platform !== 'android' && camp.platform !== 'both')
      return false;
    if (platformFilter === 'ios' && camp.platform !== 'ios' && camp.platform !== 'both')
      return false;

    // Category
    if (categoryFilter !== 'all' && camp.category !== categoryFilter) return false;

    // Reward
    if (rewardOnly && !camp.reward) return false;

    // Duration
    if (durationFilter === '14' && camp.durationDays !== 14) return false;
    if (durationFilter === '10' && camp.durationDays > 10) return false;
    if (countryFilter !== 'all' &&
      !camp.targetCountries.includes(countryFilter) &&
      !camp.targetCountries.includes('جميع الدول العربية')) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = camp.name.toLowerCase().includes(q);
      const matchDesc = camp.description.toLowerCase().includes(q);
      const matchTagline = camp.tagline.toLowerCase().includes(q);
      const matchDev = camp.developerName.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchTagline && !matchDev) return false;
    }

    return true;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section: Premium, credible startup-grade introduction */}
      <section className="pt-10 pb-12 sm:pt-14 sm:pb-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>اكتشف تطبيقات جديدة وجرّبها قبل إطلاقها</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight">
            جرّب تطبيقات جديدة <br className="hidden sm:block" />
            <span className="text-blue-700">قبل الجميع</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            اختر حملة تناسب جهازك، أرسل طلبك مباشرة دون إنشاء حساب، وشارك ملاحظاتك لتحسين التطبيقات قبل وصولها للجميع.
          </p>

          {/* Action CTAs in Hero */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <a
              href="#apps-catalog"
              className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <span>تصفح التطبيقات للاختبار</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </a>

            <button
              onClick={onOpenHowItWorks}
              className="h-10 px-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <span>كيف يعمل TestFlow؟</span>
            </button>

            <button
              onClick={onOpenDevRegister}
              className="h-10 px-4 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-xs sm:text-sm transition-colors"
            >
              للمطورين
            </button>
          </div>

          {/* Quick Pillars */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              تجارب على أجهزة حقيقية
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              خطوات ومهام اختبار واضحة
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              خصوصية لبياناتك وملاحظاتك
            </span>
          </div>

          {/* How It Works 3-Step Strip */}
          <div className="pt-5 mt-1 grid grid-cols-1 md:grid-cols-3 gap-5 text-right max-w-5xl mx-auto border-t border-slate-200">
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-black text-blue-700">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-[11px]">1</span>
                <span>اختر التطبيق المناسب</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pr-7">
                تصفح الحملات واختر تطبيقًا متوافقًا مع هاتفك واهتماماتك.
              </p>
            </div>

            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-black text-amber-700">
                <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-[11px]">2</span>
                <span>أرسل طلبك دون حساب</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pr-7">
                شارك اسمك وبريدك وبيانات جهازك ليتمكن فريق التطبيق من مراجعة الطلب.
              </p>
            </div>

            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
                <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-[11px]">3</span>
                <span>ابدأ بعد الموافقة</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pr-7">
                يصلك رابط الانضمام عند الجاهزية؛ أكمل المهام وأرسل ملاحظاتك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم التطبيق، المطور، أو التصنيف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              />
            </div>

            {/* Platform Filter Buttons */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setPlatformFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  platformFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                جميع الأنظمة
              </button>

              <button
                onClick={() => setPlatformFilter('android')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  platformFilter === 'android'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Google Play (Android)
              </button>

              <button
                onClick={() => setPlatformFilter('ios')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  platformFilter === 'ios'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                TestFlight (iOS)
              </button>
            </div>
          </div>

          {/* Secondary Filters: Categories & Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-slate-400 font-bold ml-1 hidden sm:inline">التصنيف:</span>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                    categoryFilter === cat.id
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick toggles */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={rewardOnly}
                  onChange={(e) => setRewardOnly(e.target.checked)}
                  className="rounded-sm text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <Award className="w-3.5 h-3.5 text-amber-500" />
                تطبيقات بمكافآت فقط
              </label>

              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold focus:outline-hidden"
              >
                <option value="all">كل المدد</option>
                <option value="14">14 يوماً (Google Play)</option>
                <option value="10">10 أيام أو أقل</option>
              </select>

              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold focus:outline-hidden"
                aria-label="تصفية حسب الدولة"
              >
                <option value="all">كل الدول</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section Title & Count */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              التطبيقات المتاحة للاختبار حالياً
            </h2>
            <p className="text-xs text-slate-500">
              اختر التطبيق المناسب لنظام جهازك وقدم طلبك للبدء في المهام واحتساب النشاط
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {filteredCampaigns.length} تطبيق نشط
          </span>
        </div>

        {/* App Cards Grid */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-200/80 shadow-xs">
            <Smartphone className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">لا توجد تطبيقات معروضة للاختبار حالياً</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              نضيف حملات اختبار جديدة باستمرار. عُد قريبًا للاطلاع على التطبيقات المتاحة.
            </p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200">
            <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">لا توجد تطبيقات مطابقة للبحث</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              جرب تغيير خيارات الفلترة أو إلغاء تحديد الأنظمة لرؤية المزيد من التطبيقات المتاحة
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setPlatformFilter('all');
                setCategoryFilter('all');
                setRewardOnly(false);
                setDurationFilter('all');
                setCountryFilter('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((camp) => {
              const remainingSpots = Math.max(
                0,
                camp.requiredTestersCount - camp.currentTestersCount
              );

              // Check if current tester already applied
              const isApplied = applications.some(
                (a) =>
                  a.campaignId === camp.id &&
                  ((currentTester.id !== 'guest' && a.testerId === currentTester.id) ||
                    (Boolean(currentTester.email) && a.testerEmail === currentTester.email))
              );

              return (
                <div
                  key={camp.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-blue-300"
                >
                  <div className="space-y-4">
                    {/* Header: Icon, Name, Platform Badge */}
                    <div className="flex items-start gap-3.5">
                      <AppIconImage
                        src={camp.iconUrl}
                        alt={camp.name}
                        category={camp.category}
                        appName={camp.name}
                        platform={camp.platform}
                        className="w-14 h-14 rounded-2xl shadow-xs border border-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              camp.platform === 'android'
                                ? 'bg-emerald-50 text-emerald-700'
                                : camp.platform === 'ios'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {camp.platform === 'android'
                              ? 'Android'
                              : camp.platform === 'ios'
                              ? 'iOS TestFlight'
                              : 'Android & iOS'}
                          </span>

                          <span className="text-[10px] text-slate-400 font-semibold">
                            {camp.version}
                          </span>
                        </div>

                        <h3 className="font-black text-slate-900 text-base leading-snug truncate">
                          {camp.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          بواسطة: {camp.developerName}
                        </p>
                      </div>
                    </div>

                    {/* Tagline / Brief */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {camp.tagline || camp.description}
                    </p>

                    {/* Screenshots preview strip */}
                    {camp.screenshots && camp.screenshots.length > 0 && (
                      <div className="flex gap-2 overflow-hidden rounded-xl pt-1">
                        {camp.screenshots.slice(0, 3).map((shot, sidx) => (
                          <img
                            key={sidx}
                            src={shot}
                            alt=""
                            className="w-1/3 h-24 object-cover rounded-lg border border-slate-100"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Spots & Progress Bar (Google Play Closed Track Requirement) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>المقاعد المكتملة: <strong className="text-slate-900 font-bold">{camp.currentTestersCount}</strong> / {camp.requiredTestersCount}</span>
                        </span>
                        <span className="text-blue-700 font-bold">
                          {remainingSpots > 0 ? `بقي ${remainingSpots} أماكن` : 'مكتمل'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((camp.currentTestersCount / camp.requiredTestersCount) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Duration & Reward Strip */}
                    <div className="flex flex-col gap-1.5 text-xs pt-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {camp.durationDays} يوماً متواصلاً
                        </span>
                        <span>{camp.tasks.length} مهام مجدولة</span>
                      </div>

                      {camp.reward && (
                        <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-950 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-bold truncate">{camp.reward.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => onOpenCampaign(camp.slug)}
                      className="text-xs font-bold text-slate-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                      title="فتح صفحة التطبيق برابطها المستقل"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      رابط مستقل
                    </button>

                    {isApplied ? (
                      <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        سبق التقديم
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectCampaign(camp)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5 group-hover:bg-blue-700"
                      >
                        عرض وتفاصيل الانضمام
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Why TestFlow Banner */}
        <div className="mt-12 bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-5">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold text-blue-300">
              تجربة اختبار منظمة وواضحة
            </span>
            <h3 className="text-2xl sm:text-3xl font-black leading-snug">
              شارك برأيك في التطبيقات قبل إطلاقها
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              كل حملة تعرض متطلباتها ومهامها بوضوح. قدّم دون إنشاء حساب، ولا يظهر رابط الاختبار إلا بعد مراجعة طلبك واعتماده.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="font-bold text-blue-300">اختبارات حقيقية</div>
              <p className="text-slate-400 leading-relaxed">
                جرب التطبيقات على جهازك وشارك تجربة استخدام واقعية.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="font-bold text-sky-300">مهام مفهومة</div>
              <p className="text-slate-400 leading-relaxed">
                تعليمات كل حملة تساعدك على معرفة ما يجب تجربته ومتى.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
              <div className="font-bold text-emerald-300">ملاحظات آمنة</div>
              <p className="text-slate-400 leading-relaxed">
                بيانات الطلب وملاحظات الاختبار لا تظهر في صفحات الحملات العامة.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
