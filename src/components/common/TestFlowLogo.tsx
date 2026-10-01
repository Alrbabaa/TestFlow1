import React from 'react';

interface TestFlowLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightText?: boolean;
}

/**
 * Official TestFlow Brand Logo Component
 * Renders the TestFlow wordmark asset or the scalable icon-only mark.
 */
export const TestFlowLogo: React.FC<TestFlowLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightText = false,
}) => {
  // Scaling factors based on size prop
  const iconDimensions = {
    sm: { box: 32, pad: 'p-1', radius: 'rounded-xl', text: 'text-lg', dot: 'w-2 h-2' },
    md: { box: 40, pad: 'p-1.5', radius: 'rounded-xl', text: 'text-xl', dot: 'w-2.5 h-2.5' },
    lg: { box: 52, pad: 'p-2', radius: 'rounded-2xl', text: 'text-2xl', dot: 'w-3 h-3' },
    xl: { box: 68, pad: 'p-2.5', radius: 'rounded-2xl', text: 'text-3xl', dot: 'w-3.5 h-3.5' },
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none transition-transform duration-200 hover:opacity-95 ${className}`}
    >
      {/* Icon Mark: 3D Ribbon 'T' with cyan & blue gradient */}
      <div
        className={`${showText ? 'hidden' : ''} relative shrink-0 flex items-center justify-center shadow-xs`}
        style={{ width: iconDimensions.box, height: iconDimensions.box }}
      >
        <svg
          viewBox="0 0 52 52"
          fill="none"
          className="w-full h-full drop-shadow-xs"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="tf-brand-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="tf-brand-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="tf-brand-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {/* Dark curved container badge */}
          <rect width="52" height="52" rx="14" fill="#0F172A" />

          {/* Top Bar of 'T' Ribbon */}
          <path
            d="M11 16C11 14.8954 11.8954 14 13 14H39C40.1046 14 41 14.8954 41 16V22C41 23.1046 40.1046 24 39 24H13C11.8954 24 11 23.1046 11 22V16Z"
            fill="url(#tf-brand-cyan)"
          />

          {/* Vertical Stem of 'T' Ribbon */}
          <path
            d="M21 22H31V38C31 39.1046 30.1046 40 29 40H23C21.8954 40 21 39.1046 21 38V22Z"
            fill="url(#tf-brand-blue)"
          />

          {/* Dynamic Flow Checkmark Accent */}
          <path
            d="M17 30L24 37L37 21"
            stroke="url(#tf-brand-accent)"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precision Dot */}
          <circle cx="37" cy="21" r="2.2" fill="#38BDF8" />
        </svg>
      </div>

      {showText && (
        <img
          src="/testflow-logo.png"
          alt="TestFlow"
          className="h-auto shrink-0"
          style={{
            height: iconDimensions.box,
            filter: lightText ? 'brightness(0) invert(1)' : undefined,
          }}
        />
      )}
    </div>
  );
};
