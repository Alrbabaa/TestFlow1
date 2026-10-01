import React from 'react';
import { useApp } from '../../context/AppContext';
import { TestFlowLogo } from './TestFlowLogo';
import { Code2, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenHowItWorks: () => void;
  onDeveloperAccess: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHowItWorks,
  onDeveloperAccess,
}) => {
  const { setSelectedCampaignSlug } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              setSelectedCampaignSlug(null);
            }}
          >
            <TestFlowLogo size="md" />
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              Closed Testing
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="التنقل الرئيسي">
            <button
              onClick={() => setSelectedCampaignSlug(null)}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              تصفح التطبيقات
            </button>
            <button
              onClick={onOpenHowItWorks}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              كيف يعمل؟
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1" />
            <button
              onClick={onDeveloperAccess}
              className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span>للمطورين</span>
            </button>
          </nav>

        </div>

        <nav className="md:hidden flex items-center gap-1 overflow-x-auto border-t border-slate-100 py-1.5" aria-label="التنقل الرئيسي">
          <button
            onClick={() => setSelectedCampaignSlug(null)}
            className="h-8 px-3 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 shrink-0"
          >
            التطبيقات
          </button>
          <button
            onClick={onOpenHowItWorks}
            className="h-8 px-3 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 shrink-0"
          >
            كيف يعمل
          </button>
          <button
            onClick={onDeveloperAccess}
            className="h-8 px-3 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 shrink-0"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            للمطورين
          </button>
        </nav>
      </div>
    </header>
  );
};
