import React from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  Lock,
  ArrowRight,
  X,
  FileCheck,
  Users,
  Download,
  Star,
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTesting: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartTesting,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'تقديم الطلب وتحديد نظام الهاتف (Apply)',
      desc: 'اختر التطبيق المراد اختباره، وسجل بريدك (Gmail لحساب Google Play أو Apple ID للآيفون) وطراز هاتفك بسهولة.',
      color: 'bg-blue-600 text-white',
      badge: 'الخطوة الأولى',
      icon: Smartphone,
    },
    {
      num: 2,
      title: 'إدراج البريد بالقائمة البيضاء (Whitelisting)',
      desc: 'يصدر المطور إيميلك في ملف CSV أو ينسخه مباشرة إلى Closed Testing Track بـ Google Play Console لحماية سرية النسخة التجريبية.',
      color: 'bg-amber-500 text-white',
      badge: 'الاعتماد والأمان',
      icon: ShieldCheck,
    },
    {
      num: 3,
      title: 'تفعيل الرابط وتنزيل التطبيق (Ready to Join)',
      desc: 'فور اعتماد بريدك، تتلقى إشعاراً ويفتح لك زر التنزيل الرسمي عبر متجر التطبيقات للانضمام الفوري.',
      color: 'bg-emerald-600 text-white',
      badge: 'بدء الاختبار',
      icon: Download,
    },
    {
      num: 4,
      title: 'النشاط اليومي وإنجاز المهام (14 Days Streak)',
      desc: 'افتح التطبيق يومياً لمدة 3 دقائق، وتفاعل مع الميزات والمهام المجدولة (مثل اليوم 1 و 7 و 14) وأبلغ عن أي ملاحظات.',
      color: 'bg-indigo-600 text-white',
      badge: 'شرط قوقل الأساسي',
      icon: Clock,
    },
    {
      num: 5,
      title: 'إتمام الـ 14 يوماً واستحقاق المكافأة (Rewards & Rank)',
      desc: 'باكتمال المدة بنجاح، تُصرف لك المكافأة المعلنة وترتقي رتبتك إلى Trusted أو Top Tester للحصول على الأولوية دائماً.',
      color: 'bg-purple-600 text-white',
      badge: 'المكافأة والترقية',
      icon: Star,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                كيف يعمل TestFlow؟
              </h3>
              <p className="text-[11px] text-slate-500">
                دليل رحلة الاختبار المغلق خطوة بخطوة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-600 leading-relaxed">
          {/* Highlight Box: The Google Play 20 testers / 14 days rule */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>لماذا تتبع المنصة هذا المسار الصارم؟</span>
            </div>
            <p className="text-[11px] text-blue-900/90 leading-relaxed">
              تفرض Google Play على مطوري الحسابات الشخصية مشاركة <strong>20 مختبراً حقيقياً</strong> على الأقل بفتح التطبيق يومياً لمدة <strong>14 يوماً متواصلة</strong> قبل الموافقة على النشر للعامة. صُمم TestFlow لضمان التزام الطرفين بنجاح 100%.
            </p>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-slate-900 text-xs">مراحل وخطوات الاختبار:</h4>

            <div className="space-y-2.5">
              {steps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg ${step.color} flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}
                    >
                      {step.num}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <h5 className="font-bold text-slate-900 text-xs leading-relaxed">
                          {step.title}
                        </h5>
                        <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
          <button
            onClick={() => {
              onClose();
              onStartTesting();
            }}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <span>استعراض التطبيقات والبدء</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
