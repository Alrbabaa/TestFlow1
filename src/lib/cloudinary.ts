const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
export const MAX_CAMPAIGN_IMAGE_BYTES = 3 * 1024 * 1024;

export class CampaignImageUploadError extends Error {
  constructor(message: string) { super(message); this.name = 'CampaignImageUploadError'; }
}

export const validateCampaignImage = (file: File) => {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) throw new CampaignImageUploadError('اختر صورة بصيغة PNG أو JPEG أو WebP فقط.');
  if (file.size > MAX_CAMPAIGN_IMAGE_BYTES) throw new CampaignImageUploadError('يجب ألا يزيد حجم الصورة عن 3MB.');
};

// Unsigned uploads use only public identifiers. Never add an API key, secret,
// signature, or timestamp to this browser request.
export const uploadCampaignImage = async (file: File): Promise<string> => {
  validateCampaignImage(file);
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!cloudName || !uploadPreset) throw new CampaignImageUploadError('رفع الصور غير مُعدّ بعد. أضف إعدادات Cloudinary العامة.');
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);
  let response: Response;
  try { response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: 'POST', body }); }
  catch { throw new CampaignImageUploadError('تعذر الاتصال بخدمة رفع الصور. حاول مرة أخرى.'); }
  const result = await response.json().catch(() => null) as { secure_url?: unknown; error?: { message?: unknown } } | null;
  if (!response.ok) {
    const detail = typeof result?.error?.message === 'string' ? result.error.message : '';
    if (detail.toLowerCase().includes('unknown api key')) {
      throw new CampaignImageUploadError('إعداد Cloudinary غير صحيح: اجعل Upload Preset من نوع Unsigned ثم أعد النشر.');
    }
    throw new CampaignImageUploadError(detail ? `فشل رفع الصورة: ${detail}` : 'فشل رفع الصورة. حاول مرة أخرى.');
  }
  if (typeof result?.secure_url !== 'string' || !result.secure_url.startsWith('https://')) throw new CampaignImageUploadError('لم تُرجع خدمة الصور رابطًا آمنًا صالحًا.');
  return result.secure_url;
};
