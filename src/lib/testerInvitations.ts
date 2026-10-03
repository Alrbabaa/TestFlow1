type InvitationRequest = {
  campaignId: string;
  applicationId: string;
  idToken: string;
};

const messages: Record<string, string> = {
  'tester-not-ready': 'أكد أولاً أن بريد المختبر أُضيف إلى قائمة الاختبار، ثم غيّر الحالة إلى جاهز للانضمام.',
  'campaign-access-denied': 'لا تملك صلاحية إرسال دعوة لهذه الحملة.',
  'email-service-unavailable': 'خدمة البريد غير مهيأة حالياً.',
  'email-delivery-failed': 'تعذر إرسال البريد. تحقق من إعداد Resend وحاول مرة أخرى.',
  'authentication-required': 'سجّل الدخول مرة أخرى ثم أعد المحاولة.',
  'authentication-invalid': 'انتهت جلسة الدخول. سجّل الدخول مرة أخرى.',
};

export const sendTesterInvitation = async ({ campaignId, applicationId, idToken }: InvitationRequest) => {
  const response = await fetch('/api/send-tester-invitation', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ campaignId, applicationId }),
  });

  const payload = await response.json().catch(() => null) as { error?: unknown } | null;
  if (!response.ok) {
    const code = typeof payload?.error === 'string' ? payload.error : '';
    throw new Error(messages[code] || 'تعذر إرسال رابط الاختبار. حاول مرة أخرى.');
  }
};
