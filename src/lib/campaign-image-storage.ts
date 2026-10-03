import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

const extensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
export const MAX_CAMPAIGN_IMAGE_BYTES = 3 * 1024 * 1024;

export class CampaignImageUploadError extends Error {
  constructor(message: string) { super(message); this.name = 'CampaignImageUploadError'; }
}

export const validateCampaignImage = (file: File) => {
  if (!extensions[file.type]) throw new CampaignImageUploadError('اختر صورة بصيغة PNG أو JPEG أو WebP فقط.');
  if (file.size > MAX_CAMPAIGN_IMAGE_BYTES) throw new CampaignImageUploadError('يجب ألا يزيد حجم الصورة عن 3MB.');
};

export const uploadCampaignImage = async (file: File, ownerUid: string): Promise<string> => {
  validateCampaignImage(file);
  if (!ownerUid) throw new CampaignImageUploadError('يجب تسجيل الدخول لرفع صورة التطبيق.');
  const fileRef = ref(storage, `campaigns/${ownerUid}/${crypto.randomUUID()}.${extensions[file.type]}`);
  try {
    const snapshot = await uploadBytes(fileRef, file, { contentType: file.type });
    const url = await getDownloadURL(snapshot.ref);
    if (!url.startsWith('https://')) throw new CampaignImageUploadError('لم يتم إنشاء رابط صورة آمن.');
    return url;
  } catch (error) {
    if (error instanceof CampaignImageUploadError) throw error;
    throw new CampaignImageUploadError('تعذر رفع الصورة إلى Firebase Storage. تحقق من تفعيل Storage وقواعده.');
  }
};
