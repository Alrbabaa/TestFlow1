import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmailNotification } from '../../types';
import { Mail, Check, X, Clock, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface EmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailInboxModal: React.FC<EmailInboxModalProps> = ({ isOpen, onClose }) => {
  const { emails, markEmailAsRead, unreadEmailsCount } = useApp();
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(emails[0] || null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[640px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                صندوق إشعارات البريد الإلكتروني (Email Simulator)
                {unreadEmailsCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-medium">
                    {unreadEmailsCount} جديد
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                يحاكي وصول رسائل البريد الآلية للمختبرين والمطورين حسب تغير حالات الاختبار
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split view (Emails List on Right (RTL), Details on Left) */}
        <div className="flex-1 flex overflow-hidden divide-x divide-x-reverse divide-slate-100">
          {/* Email List */}
          <div className="w-full md:w-5/12 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
            {emails.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">لا توجد رسائل حالياً</div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      if (!email.isRead) markEmailAsRead(email.id);
                    }}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-right ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-200 shadow-2xs'
                        : email.isRead
                        ? 'bg-white border-slate-200/80 hover:bg-slate-50'
                        : 'bg-white border-blue-200/90 shadow-2xs ring-1 ring-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {email.toName}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        {email.sentAt.split(' ')[1] || email.sentAt}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-bold leading-tight mb-1 truncate ${
                        !email.isRead ? 'text-blue-900 font-black' : 'text-slate-700'
                      }`}
                    >
                      {email.subject}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {email.previewText}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded-md font-medium ${
                          email.type === 'whitelisted_ready'
                            ? 'bg-emerald-50 text-emerald-700'
                            : email.type === 'accepted'
                            ? 'bg-blue-50 text-blue-700'
                            : email.type === 'completed'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {email.type === 'whitelisted_ready'
                          ? 'جاهز للتحميل'
                          : email.type === 'accepted'
                          ? 'موافقة وقائمة بيضاء'
                          : email.type === 'completed'
                          ? 'إنهاء ومكافأة'
                          : 'إشعار نظام'}
                      </span>

                      {!email.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Email Preview Details */}
          <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-6 bg-white">
            {selectedEmail ? (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                      مرسل آلياً من: TestFlow System &lt;notifications@testflow.app&gt;
                    </span>
                    <span className="text-xs text-slate-400">{selectedEmail.sentAt}</span>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 leading-snug">
                    {selectedEmail.subject}
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">إلى:</span>
                    <span>{selectedEmail.toName}</span>
                    <span className="text-slate-400">({selectedEmail.toEmail})</span>
                  </div>
                </div>

                {/* Email Mock Message Body */}
                <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/80 text-sm leading-relaxed text-slate-700 whitespace-pre-line font-normal">
                  {selectedEmail.body}
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-blue-800 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    هذه الرسالة تم توليدها تلقائياً بواسطة نظام إشعارات TestFlow المترابط مع تغيير
                    حالات المختبرين (Waiting for Whitelisting / Ready to Join / Active / Completed).
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                اختر رسالة لعرض تفاصيلها
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
