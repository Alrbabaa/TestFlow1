import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, FileText, Trash2, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'deletion';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const [tab, setTab] = useState<'privacy' | 'terms' | 'deletion'>(defaultTab);
  const [deletionEmail, setDeletionEmail] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { requestDataDeletion } = useApp();

  if (!isOpen) return null;

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionEmail) return;
    requestDataDeletion(deletionEmail);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">الخصوصية والشروط والالتزام القانوني</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 gap-2 bg-slate-50/20">
          <button
            onClick={() => {
              setTab('privacy');
              setIsSubmitted(false);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'privacy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            سياسة الخصوصية وحماية البيانات
          </button>
          <button
            onClick={() => {
              setTab('terms');
              setIsSubmitted(false);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'terms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            شروط الاستخدام واتفاقية السرية (NDA)
          </button>
          <button
            onClick={() => {
              setTab('deletion');
              setIsSubmitted(false);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'deletion'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            طلب حذف الحساب والبيانات
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-700">
          {tab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base">
                سياسة الخصوصية لمنصة TestFlow
              </h4>
              <p>
                نولي في TestFlow خصوصية بياناتك اهتماماً بالغاً. نظراً لطبيعة المنصة التي تتطلب ربط
                المختبرين ببرامج Google Play Closed Testing و TestFlight، فإننا نوضح بشفافية تامة
                طبيعة البيانات التي نجمعها وكيفية معالجتها:
              </p>
              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">1. البيانات التي يتم جمعها:</h5>
                <ul className="list-disc list-inside space-y-1 pr-2 text-slate-600">
                  <li>الاسم الكامل وعنوان البريد الإلكتروني (Gmail للمختبرين على أندرويد).</li>
                  <li>نوع نظام التشغيل، إصداره، وطراز الجهاز للتأكد من التوافق الفني.</li>
                  <li>الدولة الجغرافية للتأكد من مطابقة شروط حملة المطور.</li>
                  <li>تقارير الأخطاء والملاحظات والصور التي يرفعها المختبر طواعية.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">2. حماية البيانات وعدم إفشائها:</h5>
                <p className="text-slate-600">
                  لا يتم مشاركة بريدك الإلكتروني إلا مع مطور التطبيق الذي تقدمت بطلب اختباره حصراً،
                  وفقط لغرض إضافتك إلى القائمة البيضاء المغلقة (Closed Track) في Google Play Console
                  أو TestFlight. لا نبيع بياناتك ولا نشاركها مع أي أطراف إعلانية خارجية.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3 text-xs text-blue-800">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  يمكنك في أي وقت تقديم طلب لحذف كافة بياناتك الشخصية وحسابك نهائياً من سجلات
                  المنصة بنقرة واحدة من تبويب "طلب حذف الحساب والبيانات".
                </p>
              </div>
            </div>
          )}

          {tab === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base">
                شروط الاستخدام واتفاقية عدم الإفصاح (NDA)
              </h4>
              <p>
                بانضمامك كمختبر أو مطور إلى منصة TestFlow، فإنك توافق على الالتزام بالبنود التالية:
              </p>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">1. سرية التطبيقات غير المنشورة:</h5>
                <p className="text-slate-600">
                  التطبيقات المتاحة للاختبار تمثل نسخاً تجريبية وسرية قبل الإطلاق الرسمي. يتعهد
                  المختبر بعدم تسريب لقطات الشاشة أو ميزات التطبيق أو ملفات التثبيت (APKs) لأي طرف
                  ثالث خارج المنصة.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">2. الالتزام بمتطلبات Google Play:</h5>
                <p className="text-slate-600">
                  وفقاً لسياسة Google Play، يتطلب الاختبار المغلق الاحتفاظ بالتطبيق مثبتاً واستخدامه
                  يومياً لمدة 14 يوماً متواصلة. الانسحاب المفاجئ أو حذف التطبيق قبل إتمام المدة يؤثر
                  على سمعة المختبر (Reputation Score) وقد يحرمه من المكافأة.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">3. المكافآت والاستحقاق:</h5>
                <p className="text-slate-600">
                  يستحق المختبر المكافأة المعلنة فور استيفاء شروط الحملة المحددة من المطور (إكمال مدة
                  الاختبار والمهام اليومية وتقديم الملاحظات).
                </p>
              </div>
            </div>
          )}

          {tab === 'deletion' && (
            <div className="space-y-4">
              {isSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    تم استلام طلب حذف بياناتك بنجاح
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    تم إرسال بريد تأكيدي إلى ({deletionEmail}). سيتم محو سجل جهازك وبيانات اختباراتك
                    نهائياً خلال 48 ساعة وفق حقوق الخصوصية وحماية البيانات.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDeleteSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">حق الحذف الكامل للبيانات الشخصية (Right to be Forgotten):</p>
                      <p className="mt-1 text-amber-700">
                        سيؤدي تنفيذ هذا الطلب إلى حذف بريدك الإلكتروني، معلومات جهازك، تقييمات
                        Reputation، وتاريخ مشاركاتك السابقة نهائياً ولا يمكن التراجع عن هذا الإجراء.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      البريد الإلكتروني المسجل في المنصة *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={deletionEmail}
                      onChange={(e) => setDeletionEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      سبب طلب الحذف (اختياري)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="أخبرنا بالسبب لتحسين الخدمة..."
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      تأكيد طلب حذف البيانات والحساب
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
