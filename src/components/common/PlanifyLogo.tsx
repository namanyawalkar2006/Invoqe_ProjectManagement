import React from 'react';

interface PlanifyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  useImage?: boolean;
}

export const PlanifyLogo: React.FC<PlanifyLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  useImage = false,
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', text: 'text-sm', img: 28 },
    md: { box: 'w-8 h-8', text: 'text-base', img: 32 },
    lg: { box: 'w-12 h-12', text: 'text-2xl', img: 48 },
    xl: { box: 'w-16 h-16', text: 'text-3xl', img: 64 },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Logo Mark: Stylized vibrant Blue 'P' with Checkmark */}
      <div
        className={`${currentSize.box} relative rounded-xl overflow-hidden shadow-md shadow-blue-600/20 shrink-0 flex items-center justify-center transition-transform hover:scale-105`}
      >
        {useImage ? (
          <img
            src="/src/assets/images/planify_app_logo_1790793104320.jpg"
            alt="Planify Logo"
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Background Gradient Definitions */}
            <defs>
              <linearGradient id="planify-p-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="planify-fold-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e40af" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* P Outer Shape with rounded corners */}
            <path
              d="M20 18C20 13.5817 23.5817 10 28 10H62C77.464 10 90 22.536 90 38C90 53.464 77.464 66 62 66H42V82C42 86.4183 38.4183 90 34 90H28C23.5817 90 20 86.4183 20 82V18Z"
              fill="url(#planify-p-grad)"
            />

            {/* Subtle dimensional overlay fold at the stem junction */}
            <path
              d="M20 62L42 66V82C42 86.4183 38.4183 90 34 90H28C23.5817 90 20 86.4183 20 82V62Z"
              fill="url(#planify-fold-grad)"
              opacity="0.85"
            />

            {/* White Checkmark cut through the counter */}
            <path
              d="M32 37.5L48 53.5L78 23.5C79.5 22 82 22 83.5 23.5C85 25 85 27.5 83.5 29L50.5 62C49 63.5 46.5 63.5 45 62L28.5 45.5C27 44 27 41.5 28.5 40C30 38.5 32 38.5 32 37.5Z"
              fill="#FFFFFF"
              filter="url(#subtle-shadow)"
            />
          </svg>
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <span
          className={`font-bold tracking-tight text-slate-900 ${currentSize.text} font-sans`}
        >
          Planify
        </span>
      )}
    </div>
  );
};
