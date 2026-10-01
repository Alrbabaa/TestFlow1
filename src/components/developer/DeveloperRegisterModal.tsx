import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Code2, Building2, Mail, Globe, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface DeveloperRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperRegisterModal: React.FC<DeveloperRegisterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, userRole, getIdToken } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (userRole === 'developer_pending') setIsSuccess(true);
    if (user?.email) setFormData((current) => ({ ...current, email: user.email || '' }));
  }, [user, userRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.companyName || !formData.email) return;
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('سجّل الدخول بحساب Google أولاً.');
      const response = await fetch('/api/developer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: formData.name, companyName: formData.companyName }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'تعذر إرسال طلب المطور. حاول مرة أخرى.');
      }
      setIsSuccess(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر إرسال الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">تسجيل حساب مطور جديد</h3>
              <p className="text-xs text-slate-500">
                انضم لمجتمع TestFlow لإدارة واختبار تطبيقاتك
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

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900 text-lg">
                تم إرسال طلب انضمام المطور بنجاح!
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                طلبك قيد مراجعة فريق TestFlow. ستُفعّل مساحة المطور بعد الموافقة، ولا يمكن إنشاء الحملات قبل ذلك.
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 text-right space-y-1">
                <div className="font-semibold text-slate-900">بيانات الطلب المسجلة:</div>
                <div>الاسم: {formData.name}</div>
                <div>الشركة / الفريق: {formData.companyName}</div>
                  <div>البريد: {user?.email || formData.email}</div>
                <div className="text-amber-600 font-bold mt-1">الحالة: قيد المراجعة والاعتماد (Pending)</div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  يتم التحقق من حسابات المطورين لضمان سرية وسلامة مشاريع الاختبار وتأمين مكافآت
                  المختبرين.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المطور / ممثل الفريق *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف الراجحي"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الشركة / الاستوديو البرمجي *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أفق التقنية للحلول"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني للعمل *
                  </label>
                  <input
                    type="email"
                    required
                    readOnly={Boolean(user?.email)}
                    placeholder="developer@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الموقع الإلكتروني أو رابط GitHub
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نبذة عن التطبيقات التي تعمل عليها
                </label>
                <textarea
                  rows={2}
                  placeholder="نوعية التطبيقات التي تخطط لاختبارها (Google Play 20 مختبراً، TestFlight...)"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || userRole === 'developer_pending'}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold transition-colors"
                >
                  {isSubmitting ? 'جارٍ إرسال الطلب...' : 'إرسال طلب الانضمام للمراجعة'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
