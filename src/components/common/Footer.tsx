import React from 'react';
import { TestFlowLogo } from './TestFlowLogo';
import { Shield, Lock, Trash2, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (tab: 'privacy' | 'terms' | 'deletion') => void;
  onDeveloperAccess: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onDeveloperAccess,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-12 pb-8 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800/70">
          {/* Brand info */}
          <div className="md:col-span-5 space-y-4">
            <TestFlowLogo size="md" lightText />
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              اكتشف تطبيقات واعدة قبل إطلاقها، وشارك بتجربتك وملاحظاتك لمساعدة فرق التطوير على تقديم منتجات أفضل.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                مختبرون فعليون بأجهزة حقيقية
              </span>
              <span className="flex items-center gap-1.5 text-blue-400/90 font-medium">
                <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                حماية خصوصية وسرية التطبيقات
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">التنقل السريع</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  تصفح التطبيقات المتاحة للاختبار
                </button>
              </li>
              <li>
                <button
                  onClick={onDeveloperAccess}
                  className="hover:text-white transition-colors"
                >
                  للمطورين
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Legal */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">الأمان والخصوصية</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  سياسة الخصوصية وحماية بيانات المختبرين
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-white transition-colors"
                >
                  شروط الاستخدام واتفاقية السرية (NDA)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('deletion')}
                  className="hover:text-rose-400 transition-colors flex items-center gap-1.5 text-rose-400/80"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  طلب حذف الحساب والبيانات الشخصية
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TestFlow. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
                مساحة موثوقة لاكتشاف التطبيقات والمشاركة في اختبارها
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
