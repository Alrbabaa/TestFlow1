import React, { useMemo, useState } from 'react';
import { CheckCircle2, Copy, Download, ExternalLink, Mail, Pause, Play, Users } from 'lucide-react';
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
const statusLabels: Record<TesterStatus, string> = {
  pending: 'قيد المراجعة',
  accepted: 'مقبول',
  waiting_for_whitelisting: 'بانتظار الإضافة لقائمة الاختبار',
  ready_to_join: 'جاهز للانضمام',
  joined: 'انضم للاختبار',
  active: 'نشط',
  completed: 'مكتمل',
  inactive: 'غير نشط',
  rejected: 'مرفوض',
};
const applicationStages: { id: string; label: string; statuses: TesterStatus[] }[] = [
  { id: 'review', label: 'بحاجة إلى مراجعة', statuses: ['pending'] },
  {
    id: 'setup',
    label: 'إعداد الوصول',
    statuses: ['accepted', 'waiting_for_whitelisting', 'ready_to_join'],
  },
  { id: 'testing', label: 'قيد الاختبار', statuses: ['joined', 'active'] },
  { id: 'closed', label: 'مكتملة أو مغلقة', statuses: ['completed', 'inactive', 'rejected'] },
];
const campaignStatusLabels: Record<string, string> = {
  active: 'نشطة',
  paused: 'متوقفة مؤقتاً',
  completed: 'مكتملة',
  draft: 'مسودة',
};

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  const app = useApp();
  const [campaignId, setCampaignId] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const campaigns = app.campaigns.filter((campaign) => campaign.developerId === user?.uid);
  const applications = useMemo(
    () => app.applications.filter((item) => campaignId === 'all' || item.campaignId === campaignId),
    [app.applications, campaignId],
  );
  const selectedApps = applications.filter((item) => selected.includes(item.id));
  const visibleGroups = applicationStages
    .map((stage) => ({
      ...stage,
      applications: applications.filter(
        (item) =>
          stage.statuses.includes(item.status) &&
          (stageFilter === 'all' || stageFilter === stage.id),
      ),
    }))
    .filter((stage) => stage.applications.length > 0);
  const campaignFor = (id: string) => campaigns.find((campaign) => campaign.id === id);
  const pending = applications.filter((item) => item.status === 'pending').length;
  const activeCampaignCount = campaigns.filter((item) => item.status === 'active').length;

  const exportList = (mode: 'full' | 'gmail_only', list = applications) => {
    if (list.length) {
      exportTestersToCsv({ applications: list, campaigns, mode });
      return;
    }
    app.showToast('لا توجد طلبات لتصديرها.', 'info');
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

  const renderActions = (item: TesterApplication, busy: boolean) => (
    <div className="flex flex-wrap gap-2">
      {item.status === 'pending' && <button disabled={busy} onClick={() => changeStatus(item, 'accepted')} className="font-bold text-emerald-700 disabled:opacity-50">قبول الطلب</button>}
      {item.status === 'accepted' && <button onClick={() => changeStatus(item, 'ready_to_join')} className="font-bold text-blue-700">تأكيد الجهوزية</button>}
      {item.status === 'ready_to_join' && <button disabled={busy} onClick={() => void sendInvitation(item)} className="font-bold text-blue-700 disabled:opacity-50"><Mail className="inline h-4 w-4" /> {busy ? 'جارٍ الإرسال…' : 'إرسال رابط الاختبار'}</button>}
      {item.lastInvitationSentAt && <small className="w-full text-slate-500">آخر إرسال: {item.lastInvitationSentAt}</small>}
    </div>
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6" dir="rtl">
      <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-l from-blue-800 to-blue-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-blue-100">مساحة عملك في TestFlow</p>
          <h1 className="text-2xl font-black">مرحباً{user?.displayName ? `، ${user.displayName}` : ''}</h1>
          <p className="mt-1 text-sm text-blue-100">تابع حملاتك وطلبات المختبرين من مكان واحد.</p>
        </div>
        {pending > 0 && (
          <button
            onClick={() => {
              setStageFilter('review');
              document.getElementById('tester-applications')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-800 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Users className="h-4 w-4" />
            راجع {pending} طلب{pending === 1 ? '' : 'ات'} جديد
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'إجمالي الحملات', count: campaigns.length, icon: CheckCircle2, detail: `${activeCampaignCount} نشطة` },
          { label: 'إجمالي الطلبات', count: applications.length, icon: Users, detail: 'ضمن حملاتك' },
          { label: 'تحتاج مراجعتك', count: pending, icon: Mail, detail: 'طلبات جديدة', stage: 'review' },
          { label: 'المختبرون المكتملون', count: applications.filter((item) => item.status === 'completed').length, icon: CheckCircle2, detail: 'أنهوا الاختبار', stage: 'closed' },
        ].map(({ label, count, icon: Icon, detail, stage }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (stage) {
                setStageFilter(stage);
                document.getElementById('tester-applications')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            disabled={!stage}
            className={`rounded-xl border bg-white p-4 text-right shadow-sm ${stage ? 'cursor-pointer transition hover:border-blue-300 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600' : 'cursor-default'}`}
          >
            <span className="flex items-center justify-between">
              <small className="font-semibold text-slate-500">{label}</small>
              <Icon className="h-4 w-4 text-blue-600" />
            </span>
            <b className="mt-1 block text-2xl text-slate-900">{count}</b>
            <small className="text-slate-500">{detail}</small>
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black">حملاتي</h2>
            <p className="text-sm text-slate-500">حالة كل حملة وعدد طلبات المختبرين فيها.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{campaigns.length} حملة</span>
        </div>
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <h3 className="font-bold text-slate-800">لا توجد حملات مرتبطة بحسابك بعد</h3>
            <p className="mt-1 text-sm text-slate-500">ستظهر حملاتك هنا بعد إنشائها أو ربطها بحساب المطور.</p>
          </div>
        ) : campaigns.map((campaign) => {
          const campaignApplications = app.applications.filter((item) => item.campaignId === campaign.id);
          const progress = campaign.requiredTestersCount > 0
            ? Math.min(100, Math.round((campaign.currentTestersCount / campaign.requiredTestersCount) * 100))
            : 0;
          return (
          <div key={campaign.id} className="flex flex-col justify-between gap-3 border-b py-4 last:border-0 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <AppIconImage src={campaign.iconUrl} appName={campaign.name} category={campaign.category} className="h-11 w-11 rounded-xl" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{campaign.name}</b>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {campaignStatusLabels[campaign.status] || campaign.status}
                  </span>
                </div>
                <small className="block text-slate-500">
                  {campaign.platform === 'android' ? 'Android' : campaign.platform === 'ios' ? 'iOS' : 'Android و iOS'} · {campaign.durationDays} يوماً · {campaignApplications.length} طلب
                </small>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`تقدم حملة ${campaign.name}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                  </div>
                  <small className="text-slate-500">{campaign.currentTestersCount} من {campaign.requiredTestersCount} مختبر</small>
                </div>
              </div>
            </div>
            <span className="flex flex-wrap gap-2 text-sm">
              <a className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold hover:bg-slate-50" target="_blank" rel="noreferrer" href={`/campaign/${campaign.slug}`}><ExternalLink className="h-4 w-4" /> معاينة الصفحة</a>
              <button className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold hover:bg-slate-50" onClick={() => { setCampaignId(campaign.id); setStageFilter('all'); document.getElementById('tester-applications')?.scrollIntoView({ behavior: 'smooth' }); }}><Users className="h-4 w-4" /> الطلبات</button>
              <button className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold hover:bg-slate-50" onClick={() => void app.updateCampaign(campaign.id, { status: campaign.status === 'active' ? 'paused' : 'active' })}>{campaign.status === 'active' ? <><Pause className="h-4 w-4" /> إيقاف مؤقت</> : <><Play className="h-4 w-4" /> تفعيل</>}</button>
            </span>
          </div>
        );})}
      </section>

      <section id="tester-applications" className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-black">طلبات المختبرين</h2>
        <p className="mb-3 text-sm text-slate-600">أكد التسجيل لإرسال رسالة القبول ورابط التطبيق إلى المختبر. أضف بريده إلى قائمة الاختبار في Google Play أو TestFlight قبل بدء الاختبار.</p>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold text-slate-600">عرض الطلبات
          <select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} className="mt-1 block min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">كل حملاتي</option>
            {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          </label>
          <button disabled={!applications.length} onClick={() => exportList('full')} className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Download className="inline h-4 w-4" /> تصدير الطلبات</button>
          <button disabled={!applications.length} onClick={() => exportList('gmail_only')} className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">تصدير عناوين Gmail</button>
          <button disabled={!selectedApps.length} onClick={() => exportList('full', selectedApps)} className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">تصدير المحدد ({selectedApps.length})</button>
          <button disabled={!applications.length} onClick={() => copyTesterGmailsToClipboard(applications).then((count) => app.showToast(`تم نسخ ${count} بريد.`))} className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Copy className="inline h-4 w-4" /> نسخ عناوين Gmail</button>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="تصفية الطلبات حسب المرحلة">
          <button
            onClick={() => setStageFilter('all')}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${stageFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            الكل ({applications.length})
          </button>
          {applicationStages.map((stage) => {
            const count = applications.filter((item) => stage.statuses.includes(item.status)).length;
            return (
              <button
                key={stage.id}
                onClick={() => setStageFilter(stage.id)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${stageFilter === stage.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {stage.label} ({count})
              </button>
            );
          })}
        </div>

        {visibleGroups.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            لا توجد طلبات في هذه المرحلة حالياً.
          </p>
        ) : (
          <div className="space-y-5">
            {visibleGroups.map((group) => (
              <section key={group.id} aria-label={group.label} className="overflow-hidden rounded-xl border border-slate-200">
                <h3 className="bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                  {group.label} <span className="text-slate-500">({group.applications.length})</span>
                </h3>
                <div className="space-y-3 p-3 md:hidden">
                  {group.applications.map((item) => {
                    const campaign = campaignFor(item.campaignId);
                    const busy = sendingId === item.id;
                    return (
                      <article key={item.id} className="space-y-3 rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <b className="text-sm">{item.testerName}</b>
                            <p className="break-all text-xs text-slate-500">{item.testerEmail}</p>
                          </div>
                          <input
                            type="checkbox"
                            aria-label={`تحديد طلب ${item.testerName}`}
                            checked={selected.includes(item.id)}
                            onChange={() => setSelected((items) => items.includes(item.id) ? items.filter((id) => id !== item.id) : [...items, item.id])}
                          />
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div><dt className="text-slate-500">الحملة</dt><dd className="font-semibold">{campaign?.name || '-'}</dd></div>
                          <div><dt className="text-slate-500">الجهاز</dt><dd className="font-semibold">{item.deviceModel || '-'}</dd></div>
                          <div><dt className="text-slate-500">الدولة</dt><dd className="font-semibold">{item.testerCountry || '-'}</dd></div>
                          <div><dt className="text-slate-500">الحالة</dt><dd className="font-semibold">{statusLabels[item.status]}</dd></div>
                        </dl>
                        <label className="block text-xs font-semibold text-slate-600">
                          تغيير الحالة
                          <select
                            value={item.status}
                            onChange={(event) => changeStatus(item, event.target.value as TesterStatus)}
                            className="mt-1 w-full rounded border border-slate-200 p-2"
                          >
                            {states.map((state) => <option key={state} value={state}>{statusLabels[state]}</option>)}
                          </select>
                        </label>
                        {renderActions(item, busy)}
                      </article>
                    );
                  })}
                </div>
                <div className="hidden overflow-auto md:block">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b text-right"><th></th><th>الاسم</th><th>البريد</th><th>الحملة</th><th>الجهاز</th><th>الدولة</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                    <tbody>
                      {group.applications.map((item) => {
                        const campaign = campaignFor(item.campaignId);
                        const busy = sendingId === item.id;
                        return (
                          <tr key={item.id} className="border-b">
                            <td><input type="checkbox" aria-label={`تحديد طلب ${item.testerName}`} checked={selected.includes(item.id)} onChange={() => setSelected((items) => items.includes(item.id) ? items.filter((id) => id !== item.id) : [...items, item.id])} /></td>
                            <td>{item.testerName}</td><td>{item.testerEmail}</td><td>{campaign?.name || '-'}</td><td>{item.deviceModel || '-'}</td><td>{item.testerCountry || '-'}</td>
                            <td>
                              <select value={item.status} aria-label={`حالة ${item.testerName}`} onChange={(event) => changeStatus(item, event.target.value as TesterStatus)}>
                                {states.map((state) => <option key={state} value={state}>{statusLabels[state]}</option>)}
                              </select>
                            </td>
                            <td>{renderActions(item, busy)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
