import type { AppCampaign, TesterApplication } from '../types';

export const testerInvitationMailto = (tester: TesterApplication, campaign?: AppCampaign) => {
  if (!campaign?.testUrl) return null;
  const subject = `تم قبولك لاختبار ${campaign.name} عبر TestFlow`;
  const body = `مرحباً ${tester.testerName || 'بك'}،\n\nتم قبول طلبك لاختبار ${campaign.name}.\n\nرابط الاختبار:\n${campaign.testUrl}\n\nقد لا يعمل الرابط مباشرةً حتى تتم إضافة بريدك إلى قائمة الاختبار من صاحب الحملة. سنخبرك عند جهوزية الوصول.\n\nمع تحيات فريق TestFlow`;
  return `mailto:${encodeURIComponent(tester.testerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
