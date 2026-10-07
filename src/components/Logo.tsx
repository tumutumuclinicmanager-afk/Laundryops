import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'mono';
  showText?: boolean;
  tagline?: string;
  className?: string;
}

export const SparkleSpinsLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  showText = true,
  tagline,
  className = ''
}) => {
  const iconDimensions = {
    sm: { box: 'w-7 h-7', svg: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9 sm:w-10 sm:h-10', svg: 36, text: 'text-lg sm:text-xl', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', svg: 48, text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-16 h-16', svg: 64, text: 'text-3xl', sub: 'text-sm' }
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Precision Geometric Laundry Spin Drum Emblem */}
      <div
        className={`${iconDimensions.box} relative flex items-center justify-center rounded-xl sm:rounded-2xl transition-transform duration-200 shrink-0 ${
          variant === 'light'
            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-md shadow-blue-900/30 ring-1 ring-white/20'
            : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20'
        }`}
      >
        <svg
          width={iconDimensions.svg}
          height={iconDimensions.svg}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5"
        >
          {/* Outer Drum Rim */}
          <circle
            cx="18"
            cy="18"
            r="15"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.35"
          />
          
          {/* Hydro Spin Curved Rotor Fins */}
          <path
            d="M18 5C22.5 5 26.5 8 28.5 12C25.5 12 21 14 18 18C15 14 10.5 12 7.5 12C9.5 8 13.5 5 18 5Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path
            d="M29.5 16.5C30.5 21 28.5 25.5 25 28.5C23.5 25.5 20 22 18 18C20 14 23.5 10.5 25 7.5C28.5 10.5 30.5 15 29.5 16.5Z"
            fill="currentColor"
            fillOpacity="0.75"
          />
          <path
            d="M18 31C13.5 31 9.5 28 7.5 24C10.5 24 15 22 18 18C21 22 25.5 24 28.5 24C26.5 28 22.5 31 18 31Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path
            d="M6.5 19.5C5.5 15 7.5 10.5 11 7.5C12.5 10.5 16 14 18 18C16 22 12.5 25.5 11 28.5C7.5 25.5 5.5 21 6.5 19.5Z"
            fill="currentColor"
            fillOpacity="0.75"
          />

          {/* Central Precision Water Agitator Core */}
          <circle cx="18" cy="18" r="3.5" fill="#ffffff" />
          <circle cx="18" cy="18" r="1.5" fill="#2563eb" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${iconDimensions.text} ${
                variant === 'light' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Sparkle<span className="text-blue-600">Spins</span>
            </span>
          </div>
          {tagline ? (
            <span
              className={`${iconDimensions.sub} font-bold tracking-wider uppercase mt-1 ${
                variant === 'light' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {tagline}
            </span>
          ) : (
            <span
              className={`${iconDimensions.sub} font-semibold tracking-widest uppercase mt-0.5 ${
                variant === 'light' ? 'text-indigo-300' : 'text-blue-600'
              }`}
            >
              Laundry &amp; Garment Logistics
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SparkleSpinsLogo;
