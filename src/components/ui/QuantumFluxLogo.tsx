import React, { useState } from 'react';

export interface AutoRentLogoProps {
  variant?: 'full' | 'icon' | 'horizontal' | 'compact' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const AutoRentLogo: React.FC<AutoRentLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const [imgError, setImgError] = useState(false);

  // Size mapping for the emblem
  const iconDimensions: Record<string, { width: number; height: number; containerClass: string; imgClass: string }> = {
    xs: { width: 32, height: 20, containerClass: 'h-6 w-11', imgClass: 'h-6 w-auto' },
    sm: { width: 44, height: 26, containerClass: 'h-8 sm:h-9 w-14 sm:w-16', imgClass: 'h-8 sm:h-9 w-auto' },
    md: { width: 56, height: 32, containerClass: 'h-10 sm:h-11 w-18 sm:w-20', imgClass: 'h-10 sm:h-11 w-auto' },
    lg: { width: 80, height: 46, containerClass: 'h-14 w-26', imgClass: 'h-14 w-auto' },
    xl: { width: 140, height: 80, containerClass: 'h-20 sm:h-24 w-36 sm:w-44', imgClass: 'h-20 sm:h-24 w-auto' },
  };

  const dim = iconDimensions[size] || iconDimensions.md;

  // High-fidelity automotive badge matching the user's AUTORENT .TN emblem
  const renderEmblem = () => {
    if (!imgError) {
      return (
        <div
          className={`relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(16,185,129,0.2)] border border-emerald-500/40 bg-[#061A12] transition-transform ${dim.containerClass}`}
        >
          <img
            src="/autorent_logo.jpg"
            alt="AUTORENT CAR TUNISIA"
            className="w-full h-full object-cover object-center filter contrast-105"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }

    // High-precision SVG fallback of the metallic car silhouette + AUTORENT .TN plate
    return (
      <div
        className={`relative flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0B251A] via-[#061710] to-[#020D08] border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)] overflow-hidden ${dim.containerClass}`}
      >
        <svg
          viewBox="0 0 160 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <defs>
            <linearGradient id="ar_chrome" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#E2E8F0" />
              <stop offset="70%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="ar_green_plate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>
          </defs>

          {/* Car roof and spoiler silhouette outline */}
          <path
            d="M 16 34 C 42 27, 62 16, 92 14 C 114 12, 134 22, 148 29 C 138 29, 126 31, 118 36"
            stroke="url(#ar_chrome)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 12 36 L 46 32 C 72 20, 102 18, 128 26"
            stroke="url(#ar_chrome)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Plate contour */}
          <rect
            x="8"
            y="36"
            width="144"
            height="46"
            rx="6"
            fill="url(#ar_green_plate)"
            stroke="url(#ar_chrome)"
            strokeWidth="2.5"
          />

          {/* Text: AUTORENT */}
          <text
            x="16"
            y="56"
            fill="#FFFFFF"
            fontSize="15"
            fontWeight="900"
            letterSpacing="1.5"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            AUTORENT
          </text>

          {/* .TN Box */}
          <rect
            x="116"
            y="43"
            width="30"
            height="15"
            rx="2.5"
            fill="#CBD5E1"
            stroke="#64748B"
            strokeWidth="0.8"
          />
          <text
            x="121"
            y="54"
            fill="#0F172A"
            fontSize="10"
            fontWeight="900"
            fontFamily="monospace"
          >
            .TN
          </text>

          {/* Arabic: لكراء السيارات */}
          <text
            x="80"
            y="75"
            textAnchor="middle"
            fill="#E2E8F0"
            fontSize="11"
            fontWeight="bold"
            fontFamily="serif, system-ui"
          >
            لكراء السيارات
          </text>
        </svg>
      </div>
    );
  };

  if (variant === 'icon') {
    return renderEmblem();
  }

  // Full / Horizontal / Compact Logo with Typography
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none min-w-0 ${className}`}>
      {renderEmblem()}

      <div className="flex flex-col justify-center leading-none min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-extrabold tracking-[0.05em] sm:tracking-[0.08em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-200 drop-shadow-sm font-sans text-sm sm:text-base md:text-lg whitespace-nowrap">
            AUTORENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-black">CAR TUNISIA</span>
          </span>
          <span className="inline-block text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex-shrink-0">
            .TN
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
            <span className="hidden sm:block text-[9px] sm:text-[10px] md:text-[11px] font-medium tracking-[0.04em] text-slate-400 uppercase font-sans truncate">
              Location de Voitures en Tunisie
            </span>
            <span className="hidden sm:inline-block text-[9px] sm:text-[10px] text-emerald-400 font-serif font-bold">
              • لكراء السيارات
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Backward-compatible alias for QuantumFluxLogo
export const QuantumFluxLogo = AutoRentLogo;
export default AutoRentLogo;
