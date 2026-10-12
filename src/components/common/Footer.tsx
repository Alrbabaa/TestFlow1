import React from 'react';
import { TestFlowLogo } from './TestFlowLogo';
import { Shield, Lock, Trash2, CheckCircle2, ShieldCheck, Globe, Instagram, Linkedin, Mail, Music2 } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (tab: 'privacy' | 'terms' | 'deletion') => void;
  onDeveloperAccess: () => void;
  onAdminAccess: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onDeveloperAccess,
  onAdminAccess,
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

        <div className="pt-5 flex justify-center border-t border-slate-800/50 mt-6">
          <button
            type="button"
            onClick={onAdminAccess}
            aria-label="تسجيل دخول الإدارة"
            title="تسجيل دخول الإدارة"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/50 px-2 py-1 text-[10px] font-medium text-slate-500 hover:border-slate-700 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>دخول الإدارة</span>
          </button>
        </div>

        <section className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-center" aria-label="الشركة الأم">
          <div className="flex items-center gap-2">
            <img src="/artistic-minds-logo.jpg" alt="Artistic Minds" className="h-9 w-9 rounded-lg border border-slate-700 object-cover" />
            <div className="text-right" dir="rtl">
              <p className="text-xs font-black text-slate-100">الشركة الأم: Artistic Minds</p>
              <p className="text-[11px] text-slate-400">TestFlow إحدى منتجات Artistic Minds</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <a aria-label="الموقع الرسمي لـ Artistic Minds" title="الموقع الرسمي" href="https://artisticmindsa.com" target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"><Globe className="h-4 w-4" /></a>
            <a aria-label="البريد الإلكتروني لـ Artistic Minds" title="البريد الإلكتروني" href="mailto:artisticmindsa.r@gmail.com" className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"><Mail className="h-4 w-4" /></a>
            <a aria-label="TikTok Artistic Minds" title="TikTok" href="https://www.tiktok.com/@artistic.minds8?_r=1&_t=ZS-98yHtzRROoK" target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"><Music2 className="h-4 w-4" /></a>
            <a aria-label="X Artistic Minds" title="X" href="https://x.com/ArtisticMindsa" target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"><span className="text-sm font-black leading-none">X</span></a>
            <a aria-label="LinkedIn Artistic Minds" title="LinkedIn" href="https://www.linkedin.com/in/artistic-minds-undefined-813b74423?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"><Linkedin className="h-4 w-4" /></a>
            <a aria-label="Instagram Artistic Minds" title="Instagram" href="https://www.instagram.com/artistic_minds.24?igsh=YjRsZ3NjeGxhdGo3" target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"><Instagram className="h-4 w-4" /></a>
          </div>
        </section>

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
