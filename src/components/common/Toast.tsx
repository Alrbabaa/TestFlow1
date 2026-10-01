import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm w-full">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
          isSuccess
            ? 'bg-emerald-950/90 text-white border-emerald-500/40'
            : isWarning
            ? 'bg-amber-950/90 text-white border-amber-500/40'
            : isError
            ? 'bg-rose-950/90 text-white border-rose-500/40'
            : 'bg-slate-900/95 text-white border-slate-700'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
          {isError && <XCircle className="w-5 h-5 text-rose-400" />}
          {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-sky-400" />}
        </div>

        <div className="flex-1 text-xs font-semibold leading-relaxed text-slate-100">
          {toast.message}
        </div>

        <button
          onClick={hideToast}
          className="shrink-0 text-slate-400 hover:text-white transition-colors p-0.5"
          aria-label="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
