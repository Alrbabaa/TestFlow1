import React, { useState } from 'react';
import { Check, Download, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportTestersToCsv } from '../../utils/exportTesters';
import type { AppCampaign } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { campaigns, applications, developers, addCampaign, removeCampaign, updateDeveloperStatus, showToast } = useApp();
  const [name, setName] = useState(''); const [slug, setSlug] = useState(''); const [testUrl, setTestUrl] = useState('');
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); if (!name.trim() || !slug.trim() || !testUrl.trim()) return;
    await addCampaign({ name: name.trim(), slug: slug.trim().toLowerCase(), tagline: '', description: '', iconUrl: '', screenshots: [], developerId: '', developerName: 'TestFlow', platform: 'android', testType: 'google_play_closed', testUrl: testUrl.trim(), version: '1.0.0', durationDays: 14, requiredTestersCount: 20, targetCountries: [], targetDevices: [], minOsVersion: '', testingInstructions: '', category: 'tools', startDate: new Date().toISOString().slice(0, 10), endDate: '', status: 'active', tasks: [] });
    setName(''); setSlug(''); setTestUrl(''); showToast('Campaign created.');
  };
  return <main className="max-w-6xl mx-auto p-6 space-y-8" dir="rtl">
    <section className="bg-slate-900 text-white rounded-2xl p-6"><h1 className="text-2xl font-black">لوحة الإدارة</h1><p className="text-slate-300 mt-1">Firestore protected administration</p></section>
    <section className="grid md:grid-cols-3 gap-4"><div className="p-4 rounded-xl border"><Users /> <b>{applications.length}</b> طلب مختبر</div><div className="p-4 rounded-xl border"><b>{campaigns.length}</b> حملة</div><div className="p-4 rounded-xl border"><b>{developers.length}</b> طلب مطور</div></section>
    <section className="border rounded-2xl p-5"><h2 className="font-bold mb-4">إنشاء حملة</h2><form onSubmit={create} className="grid md:grid-cols-3 gap-3"><input required value={name} onChange={(e) => setName(e.target.value)} className="border rounded-lg p-2" placeholder="اسم التطبيق" /><input required value={slug} onChange={(e) => setSlug(e.target.value)} className="border rounded-lg p-2" placeholder="rawnak" /><input required type="url" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} className="border rounded-lg p-2" placeholder="رابط الاختبار الخاص" /><button className="md:col-span-3 bg-blue-600 text-white p-3 rounded-lg"><Plus className="inline w-4" /> إنشاء</button></form></section>
    <section className="border rounded-2xl p-5"><div className="flex justify-between"><h2 className="font-bold">طلبات المطورين</h2><button onClick={() => exportTestersToCsv({ applications, campaigns, filename: 'testflow-testers.csv' })} className="text-sm"><Download className="inline w-4" /> CSV</button></div><div className="mt-4 space-y-2">{developers.map((developer) => <div key={developer.id} className="flex justify-between border rounded-lg p-3"><span>{developer.name} — {developer.companyName}</span>{developer.status === 'pending_approval' && <span><button onClick={() => updateDeveloperStatus(developer.id, 'approved')} className="text-emerald-700 ml-3"><Check className="inline w-4" /> قبول</button><button onClick={() => updateDeveloperStatus(developer.id, 'rejected')} className="text-rose-700">رفض</button></span>}</div>)}</div></section>
    <section className="border rounded-2xl p-5"><h2 className="font-bold mb-4">الحملات</h2><div className="space-y-2">{campaigns.map((campaign: AppCampaign) => <div key={campaign.id} className="flex justify-between border rounded-lg p-3"><span>{campaign.name} <small className="text-slate-500">/campaign/{campaign.slug}</small></span><button onClick={() => void removeCampaign(campaign.id)} className="text-rose-700"><Trash2 className="w-4" /></button></div>)}</div></section>
  </main>;
};
