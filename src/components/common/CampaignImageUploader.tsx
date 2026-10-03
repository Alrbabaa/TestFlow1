import React, { useEffect, useRef, useState } from 'react';
import { ImageUp, Link, LoaderCircle, Trash2 } from 'lucide-react';
import { AppIconImage } from './AppIconImage';
import { uploadCampaignImage, validateCampaignImage } from '../../lib/cloudinary';

interface CampaignImageUploaderProps {
  value: string;
  appName: string;
  category?: string;
  disabled?: boolean;
  onChange: (url: string) => void;
  onUploadStateChange?: (uploading: boolean) => void;
}

const isHttpsUrl = (value: string) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

export const CampaignImageUploader: React.FC<CampaignImageUploaderProps> = ({ value, appName, category, disabled = false, onChange, onUploadStateChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [imageUrl, setImageUrl] = useState(value);
  const preview = localPreview || value;

  useEffect(() => { setImageUrl(value); }, [value]);
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);
  const changeUploadState = (active: boolean) => { setUploading(active); onUploadStateChange?.(active); };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try { validateCampaignImage(file); } catch (reason) { setError(reason instanceof Error ? reason.message : 'ملف الصورة غير صالح.'); return; }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file)); setFileName(file.name); setError(''); changeUploadState(true);
    try {
      const secureUrl = await uploadCampaignImage(file);
      onChange(secureUrl); setLocalPreview('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'فشل رفع الصورة.'); }
    finally { changeUploadState(false); }
  };

  const useImageUrl = () => {
    const normalized = imageUrl.trim();
    if (!isHttpsUrl(normalized)) { setError('أدخل رابط صورة آمنًا يبدأ بـ https://'); return; }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(''); setFileName(''); setError(''); onChange(normalized);
  };
  const remove = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(''); setFileName(''); setImageUrl(''); setError(''); onChange('');
  };

  return <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4" dir="rtl">
    <div className="flex items-center gap-3"><AppIconImage src={preview} appName={appName} category={category} className="h-16 w-16 rounded-2xl" /><div className="min-w-0 flex-1"><p className="font-bold text-slate-800">صورة التطبيق</p><p className="text-xs text-slate-500">ارفع صورة أو استخدم رابط HTTPS مباشر.</p>{fileName && <p className="mt-1 truncate text-xs text-slate-600">{fileName}</p>}</div></div>
    <input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} disabled={disabled || uploading} />
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || uploading} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}{uploading ? 'جارٍ رفع الصورة…' : preview ? 'تغيير الصورة من الجهاز' : 'رفع صورة من الجهاز'}</button>{preview && !uploading && <button type="button" onClick={remove} disabled={disabled} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"><Trash2 className="h-4 w-4" /> إزالة الصورة</button>}</div>
    <div className="border-t border-slate-200 pt-3"><label className="block text-xs font-semibold text-slate-700">أو رابط صورة مباشر</label><div className="mt-1 flex flex-col gap-2 sm:flex-row"><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} disabled={disabled || uploading} dir="ltr" inputMode="url" placeholder="https://example.com/app-icon.png" className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-60" /><button type="button" onClick={useImageUrl} disabled={disabled || uploading || !imageUrl.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Link className="h-4 w-4" /> استخدام الرابط</button></div></div>
    {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
  </div>;
};
