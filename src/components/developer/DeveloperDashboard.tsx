import React, { useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, Mail, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AppIconImage } from '../common/AppIconImage';
import { sendTesterInvitation } from '../../lib/testerInvitations';
import { copyTesterGmailsToClipboard, exportTestersToCsv } from '../../utils/exportTesters';
import type { TesterApplication, TesterStatus } from '../../types';

const states: TesterStatus[] = [
  'pending', 'accepted', 'waiting_for_whitelisting', 'ready_to_join',
  'joined', 'active', 'completed', 'inactive', 'rejected',
];

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  const app = useApp();
  const [campaignId, setCampaignId] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const campaigns = app.campaigns.filter((campaign) => campaign.developerId === user?.uid);
  const applications = useMemo(
    () => app.applications.filter((item) => campaignId === 'all' || item.campaignId === campaignId),
    [app.applications, campaignId],
  );
  const selectedApps = applications.filter((item) => selected.includes(item.id));
  const campaignFor = (id: string) => campaigns.find((campaign) => campaign.id === id);
  const pending = applications.filter((item) => item.status === 'pending').length;

  const exportList = (mode: 'full' | 'gmail_only', list = applications) => {
    if (list.length) exportTestersToCsv({ applications: list, campaigns, mode });
  };

  const changeStatus = (application: TesterApplication, status: TesterStatus) => {
    app.updateApplicationStatus(application.id, status);
    if (status === 'ready_to_join') {
      app.showToast('أصبح المختبر جاهزاً. يمكنك الآن إرسال رابط الاختبار الآمن عبر البريد.');
    }
  };

  const sendInvitation = async (application: TesterApplication) => {
    if (!user) return;
    setSendingId(application.id);
    try {
      const idToken = await user.getIdToken();
      await sendTesterInvitation({ campaignId: application.campaignId, applicationId: application.id, idToken });
      app.showToast('تم إرسال رابط الاختبار إلى المختبر عبر البريد.');
    } catch (error) {
      app.showToast(error instanceof Error ? error.message : 'تعذر إرسال رابط الاختبار.', 'error');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6" dir="rtl">
      <header className="rounded-2xl bg-blue-700 p-6 text-white">
        <h1 className="text-2xl font-black">لوحة المطور</h1>
        <p className="text-blue-100">تظهر هنا حملاتك وطلبات المختبرين التابعة لها فقط.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          ['حملاتي', campaigns.length],
          ['النشطة', campaigns.filter((item) => item.status === 'active').length],
          ['إجمالي المختبرين', applications.length],
          ['المعلقة', pending],
          ['المقبولة', applications.filter((item) => item.status === 'accepted').length],
          ['المكتملة', applications.filter((item) => item.status === 'completed').length],
        ].map(([label, count]) => (
          <div key={String(label)} className="rounded-xl border bg-white p-4">
            <small>{label}</small><b className="block text-xl">{count}</b>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-3 text-lg font-black">حملاتي</h2>
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="flex flex-col justify-between gap-2 border-b py-3 last:border-0 md:flex-row">
            <div className="flex items-center gap-3">
              <AppIconImage src={campaign.iconUrl} appName={campaign.name} category={campaign.category} className="h-11 w-11 rounded-xl" />
              <span>
                <b>{campaign.name}</b> · /{campaign.slug} · {campaign.platform} · {campaign.testType} · {campaign.status}
                <small className="block text-slate-500">{app.applications.filter((item) => item.campaignId === campaign.id).length}/{campaign.requiredTestersCount} · {campaign.durationDays} يوم</small>
              </span>
            </div>
            <span className="flex flex-wrap gap-3 text-sm">
              <a target="_blank" rel="noreferrer" href={`/campaign/${campaign.slug}`}><ExternalLink className="inline h-4 w-4" /> العامة</a>
              <button onClick={() => setCampaignId(campaign.id)}><Users className="inline h-4 w-4" /> المختبرون</button>
              <button onClick={() => void app.updateCampaign(campaign.id, { status: campaign.status === 'active' ? 'paused' : 'active' })}>{campaign.status === 'active' ? 'إيقاف' : 'تفعيل'}</button>
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-2 text-lg font-black">طلبات المختبرين</h2>
        <p className="mb-3 text-sm text-slate-600">اقبل الطلب، ثم أضف بريد المختبر إلى قائمة الاختبار في Google Play أو TestFlight. بعد ذلك غيّر الحالة إلى «جاهز للانضمام» وأرسل الرابط عبر البريد.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          <select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} className="rounded border p-2">
            <option value="all">كل حملاتي</option>
            {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          <button onClick={() => exportList('full')} className="rounded border p-2"><Download className="inline h-4 w-4" /> CSV</button>
          <button onClick={() => exportList('gmail_only')} className="rounded border p-2">Gmail CSV</button>
          <button onClick={() => exportList('full', selectedApps)} className="rounded border p-2">المحدد</button>
          <button onClick={() => copyTesterGmailsToClipboard(applications).then((count) => app.showToast(`تم نسخ ${count} بريد.`))} className="rounded border p-2"><Copy className="inline h-4 w-4" /> نسخ Gmail</button>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-right"><th></th><th>الاسم</th><th>Gmail</th><th>الحملة</th><th>الجهاز</th><th>الدولة</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>
              {applications.map((item) => {
                const campaign = campaignFor(item.campaignId);
                const busy = sendingId === item.id;
                return (
                  <tr key={item.id} className="border-b">
                    <td><input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected((items) => items.includes(item.id) ? items.filter((id) => id !== item.id) : [...items, item.id])} /></td>
                    <td>{item.testerName}</td><td>{item.testerEmail}</td><td>{campaign?.name || '-'}</td><td>{item.deviceModel || '-'}</td><td>{item.testerCountry || '-'}</td>
                    <td><select value={item.status} onChange={(event) => changeStatus(item, event.target.value as TesterStatus)}>{states.map((state) => <option key={state}>{state}</option>)}</select></td>
                    <td><div className="flex flex-wrap gap-2">
                      {item.status === 'pending' && <button onClick={() => changeStatus(item, 'accepted')} className="font-bold text-emerald-700">قبول</button>}
                      {item.status === 'accepted' && <button onClick={() => changeStatus(item, 'ready_to_join')} className="font-bold text-blue-700">تأكيد الجهوزية</button>}
                      {item.status === 'ready_to_join' && <button disabled={busy} onClick={() => void sendInvitation(item)} className="font-bold text-blue-700 disabled:opacity-50"><Mail className="inline h-4 w-4" /> {busy ? 'جارٍ الإرسال…' : 'إرسال رابط الاختبار'}</button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
