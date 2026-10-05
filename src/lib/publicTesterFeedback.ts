type FeedbackTarget = 'app' | 'developer';
type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

const messages: Record<string, string> = {
  'application-not-found': 'لم نجد طلباً بهذا البريد لهذه الحملة.',
  'application-not-accepted': 'يمكنك التقييم أو الإبلاغ بعد قبول طلبك للمشاركة.',
  'already-submitted': 'سبق إرسال هذا التقييم أو البلاغ لهذا الطلب.',
  'submission-unavailable': 'تعذر حفظ طلبك الآن. حاول مرة أخرى.',
  'invalid-feedback': 'تحقق من التقييم والتعليق.',
  'invalid-report': 'أكمل عنوان البلاغ ووصفه.',
};

const submit = async (payload: Record<string, unknown>) => {
  const response = await fetch('/api/submit-tester-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null) as { error?: unknown } | null;
  if (!response.ok) {
    const code = typeof result?.error === 'string' ? result.error : '';
    throw new Error(messages[code] || 'تعذر إرسال الطلب. حاول مرة أخرى.');
  }
};

export const submitTesterRating = (input: {
  campaignId: string; email: string; target: FeedbackTarget; rating: number; comment: string;
}) => submit({ ...input, kind: 'feedback' });

export const submitTesterReport = (input: {
  campaignId: string; email: string; title: string; description: string; severity: ReportSeverity;
}) => submit({ ...input, kind: 'report' });
