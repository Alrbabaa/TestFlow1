import React, { useState } from 'react';
import {
  Smartphone,
  BookOpen,
  Wallet,
  Sparkles,
  Gamepad2,
  Heart,
  Layers,
  Code2,
  Music,
  ShoppingBag,
  Cpu,
} from 'lucide-react';

interface AppIconImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  category?: string;
  appName?: string;
  platform?: 'android' | 'ios' | 'both';
}

/**
 * Resilient App Icon Image Component
 * Ensures app images NEVER fail, break, or show ugly broken image boxes.
 * Seamlessly falls back to a branded, high-contrast, modern gradient icon with category iconography.
 */
export const AppIconImage: React.FC<AppIconImageProps> = ({
  src,
  alt = 'App Icon',
  className = 'w-14 h-14 rounded-2xl',
  category = 'tools',
  appName = '',
  platform,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Category-based aesthetic gradients and icons
  const getCategoryTheme = (cat: string) => {
    const normalized = (cat || '').toLowerCase();
    if (normalized.includes('fin') || normalized.includes('مال') || normalized.includes('money')) {
      return {
        gradient: 'from-emerald-500 to-teal-700',
        textColor: 'text-emerald-100',
        icon: Wallet,
        bgPattern: 'bg-emerald-950/20',
      };
    }
    if (normalized.includes('game') || normalized.includes('لعب') || normalized.includes('ترفيه')) {
      return {
        gradient: 'from-purple-600 to-indigo-800',
        textColor: 'text-purple-100',
        icon: Gamepad2,
        bgPattern: 'bg-purple-950/20',
      };
    }
    if (normalized.includes('book') || normalized.includes('كتب') || normalized.includes('قراء') || normalized.includes('audio')) {
      return {
        gradient: 'from-amber-500 to-orange-700',
        textColor: 'text-amber-100',
        icon: BookOpen,
        bgPattern: 'bg-amber-950/20',
      };
    }
    if (normalized.includes('health') || normalized.includes('صحة') || normalized.includes('رياض') || normalized.includes('fit')) {
      return {
        gradient: 'from-rose-500 to-pink-700',
        textColor: 'text-rose-100',
        icon: Heart,
        bgPattern: 'bg-rose-950/20',
      };
    }
    if (normalized.includes('ai') || normalized.includes('ذكاء') || normalized.includes('تقني')) {
      return {
        gradient: 'from-cyan-500 to-blue-700',
        textColor: 'text-cyan-100',
        icon: Sparkles,
        bgPattern: 'bg-blue-950/20',
      };
    }
    if (normalized.includes('music') || normalized.includes('صوت') || normalized.includes('بودكاست')) {
      return {
        gradient: 'from-fuchsia-500 to-purple-700',
        textColor: 'text-fuchsia-100',
        icon: Music,
        bgPattern: 'bg-fuchsia-950/20',
      };
    }
    if (normalized.includes('shop') || normalized.includes('تسو') || normalized.includes('تجار')) {
      return {
        gradient: 'from-blue-600 to-indigo-700',
        textColor: 'text-blue-100',
        icon: ShoppingBag,
        bgPattern: 'bg-indigo-950/20',
      };
    }
    // Default Productivity / General Apps
    return {
      gradient: 'from-blue-600 to-slate-900',
      textColor: 'text-blue-100',
      icon: Smartphone,
      bgPattern: 'bg-slate-950/20',
    };
  };

  const theme = getCategoryTheme(category);
  const IconComponent = theme.icon;

  const validSrc = src && typeof src === 'string' && src.trim().length > 5 && !src.includes('صورة ChatGPT');

  // Extract first letter for monogram if no icon
  const firstLetter = appName.trim().charAt(0) || 'A';

  if (!validSrc || hasError) {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 bg-gradient-to-br ${theme.gradient} text-white shadow-xs overflow-hidden select-none ${className}`}
        title={appName || alt}
      >
        <div className={`absolute inset-0 ${theme.bgPattern}`} />
        <div className="relative flex flex-col items-center justify-center">
          <IconComponent className="w-1/2 h-1/2 drop-shadow-xs stroke-[2.2]" />
          {appName && (
            <span className="text-[9px] font-black uppercase tracking-wider opacity-90 truncate max-w-[85%] mt-0.5">
              {firstLetter}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden bg-slate-100 ${className}`}>
      {!isLoaded && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${theme.gradient} text-white animate-pulse`}
        >
          <IconComponent className="w-1/2 h-1/2 opacity-60" />
        </div>
      )}
      <img
        src={src}
        alt={alt || appName}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};
