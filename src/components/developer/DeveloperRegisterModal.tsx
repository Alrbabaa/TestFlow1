import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const DeveloperRegisterModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, userRole } = useAuth();
  const { registerDeveloper } = useApp();
  const [name, setName] = useState(''); const [companyName, setCompanyName] = useState(''); const [submitted, setSubmitted] = useState(false);
  useEffect(() => { if (user?.displayName) setName(user.displayName); if (userRole === 'developer_pending') setSubmitted(true); }, [user, userRole]);
  if (!isOpen) return null;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim() || !companyName.trim()) return;
    registerDeveloper({ name: name.trim(), companyName: companyName.trim(), email: user.email || '' });
    setSubmitted(true);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6" dir="rtl">
      <button onClick={onClose} className="float-left p-2 text-slate-500"><X className="w-5 h-5" /></button>
      {submitted ? <div className="text-center py-8 space-y-3"><CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" /><h3 className="font-bold text-lg">تم إرسال طلب المطوّر</h3><p className="text-sm text-slate-600">سيظهر لك الوصول بعد موافقة الإدارة.</p><button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-lg">إغلاق</button></div> :
        <form onSubmit={submit} className="space-y-4"><div className="flex gap-2 items-center"><Building2 className="text-blue-600" /><h3 className="font-bold text-lg">طلب انضمام مطوّر</h3></div>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="w-full border rounded-lg p-3" />
          <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="اسم الشركة أو الفريق" className="w-full border rounded-lg p-3" />
          <input readOnly value={user?.email || ''} className="w-full border rounded-lg p-3 bg-slate-50" />
          <button className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold">إرسال الطلب</button>
        </form>}
    </div>
  </div>;
};
