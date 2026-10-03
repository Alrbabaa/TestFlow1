import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const DeveloperRegisterModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, userRole } = useAuth(); const { registerDeveloper } = useApp();
  const [name, setName] = useState(''); const [companyName, setCompanyName] = useState(''); const [bio, setBio] = useState(''); const [submitted, setSubmitted] = useState(false); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  useEffect(() => { if (user?.displayName) setName(user.displayName); if (userRole === 'developer_pending') setSubmitted(true); }, [user, userRole]);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!user) return setError('سجل الدخول بحساب Google أولاً.');
    if (!name.trim() || !companyName.trim()) return setError('أدخل الاسم واسم الشركة أو الفريق.');
    setSaving(true);
    try { await registerDeveloper({ name:name.trim(), companyName:companyName.trim(), email:user.email || '', bio:bio.trim() || undefined }); setSubmitted(true); }
    catch (reason: any) { setError(reason?.code === 'permission-denied' ? 'لا تملك قاعدة البيانات صلاحية حفظ الطلب. تحقق من نشر Firestore Rules.' : 'تعذر حفظ الطلب بسبب الاتصال بقاعدة البيانات. حاول مرة أخرى.'); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60" dir="rtl"><div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6">
    <button onClick={onClose} className="float-left p-2 text-slate-500" aria-label="إغلاق"><X className="w-5 h-5"/></button>
    {submitted ? <div className="text-center py-8 space-y-3"><CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto"/><h2 className="font-bold text-xl">تم إرسال طلب الانضمام</h2><p className="text-sm text-slate-600">يراجع فريق TestFlow طلبك. ستتمكن من الدخول إلى لوحة المطور بعد الموافقة.</p><button onClick={onClose} className="px-5 py-2 bg-slate-900 text-white rounded-lg">إغلاق</button></div> :
      <form onSubmit={submit} className="space-y-4"><div className="flex gap-2 items-center"><Building2 className="text-blue-600"/><div><h2 className="font-bold text-xl">طلب الانضمام كمطور</h2><p className="text-sm text-slate-500">أرسل بياناتك ليتم اعتماد حسابك وإتاحة إنشاء الحملات.</p></div></div>
        <div className="rounded-lg bg-blue-50 text-blue-800 p-3 text-sm flex gap-2"><Info className="w-5 shrink-0"/>يستخدم الطلب حساب Google الحالي فقط. لا تشارك كلمة مرور أو معلومات حساسة.</div>
        {error && <div role="alert" className="rounded-lg bg-rose-50 text-rose-700 p-3 text-sm">{error}</div>}
        <label className="block text-sm font-bold text-slate-700">الاسم الكامل<input required value={name} onChange={e=>setName(e.target.value)} placeholder="مثال: أحمد محمد" className="mt-1 w-full border rounded-lg p-3 font-normal"/></label>
        <label className="block text-sm font-bold text-slate-700">البريد الإلكتروني<input readOnly value={user?.email || ''} className="mt-1 w-full border rounded-lg p-3 bg-slate-50 font-normal"/></label>
        <label className="block text-sm font-bold text-slate-700">اسم الشركة أو الفريق<input required value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="مثال: فريق رونق" className="mt-1 w-full border rounded-lg p-3 font-normal"/></label>
        <label className="block text-sm font-bold text-slate-700">نبذة قصيرة <span className="font-normal text-slate-400">(اختياري)</span><textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="صف التطبيق أو نوع الحملات التي تريد إطلاقها" className="mt-1 w-full border rounded-lg p-3 min-h-24 font-normal"/></label>
        <button disabled={saving} className="w-full py-3 rounded-lg bg-blue-600 disabled:bg-slate-300 text-white font-bold">{saving ? 'جارٍ إرسال الطلب...' : 'إرسال طلب الانضمام'}</button>
      </form>}
  </div></div>;
};
