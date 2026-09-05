import React from 'react';

interface QuantumFluxLogoProps {
  variant?: 'full' | 'icon' | 'horizontal' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const QuantumFluxLogo: React.FC<QuantumFluxLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  // Size mapping for the icon
  const iconDimensions: Record<string, { width: number; height: number; containerClass: string }> = {
    xs: { width: 24, height: 24, containerClass: 'w-6 h-6' },
    sm: { width: 34, height: 34, containerClass: 'w-8 h-8 sm:w-9 sm:h-9' },
    md: { width: 44, height: 44, containerClass: 'w-10 h-10 sm:w-11 sm:h-11' },
    lg: { width: 64, height: 64, containerClass: 'w-16 h-16' },
    xl: { width: 96, height: 96, containerClass: 'w-24 h-24' },
  };

  const dim = iconDimensions[size] || iconDimensions.md;

  // Custom high-precision SVG matching the 3D metallic blue QuantumFlux Q-arrow mark
  const renderIcon = () => (
    <div
      className={`relative flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#122244] via-[#0B152B] to-[#060D1A] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)] overflow-hidden ${dim.containerClass}`}
    >
      {/* Background glow & metallic texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.35),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[82%] h-[82%] drop-shadow-[0_2px_8px_rgba(14,165,233,0.6)]"
      >
        <defs>
          {/* Main Metallic Blue Gradients */}
          <linearGradient id="qf_ring_main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="25%" stopColor="#0EA5E9" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="75%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#082F49" />
          </linearGradient>

          <linearGradient id="qf_arrow_main" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="35%" stopColor="#0284C7" />
            <stop offset="70%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>

          <linearGradient id="qf_bevel_highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="qf_shadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Circular Ring of Q */}
        <circle
          cx="48"
          cy="52"
          r="32"
          stroke="url(#qf_ring_main)"
          strokeWidth="11"
          strokeLinecap="round"
          className="filter drop-shadow"
        />

        {/* Inner Shadow Arc */}
        <circle
          cx="48"
          cy="52"
          r="26"
          stroke="url(#qf_bevel_highlight)"
          strokeWidth="1.5"
          opacity="0.75"
        />

        {/* Lower tail curve of Q */}
        <path
          d="M 62 66 C 68 72, 73 75, 78 77 L 72 79 L 60 70 Z"
          fill="url(#qf_ring_main)"
          stroke="#0284C7"
          strokeWidth="1"
        />

        {/* Dynamic Arrow cutting across at 45 degrees */}
        <g className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {/* Arrow Shaft */}
          <path
            d="M 27 75 L 67 35"
            stroke="url(#qf_arrow_main)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Arrow Shaft Highlight */}
          <path
            d="M 27 74 L 66 35"
            stroke="#BAE6FD"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Arrow Head */}
          <path
            d="M 52 32 L 78 22 L 68 48 L 61 39 Z"
            fill="url(#qf_arrow_main)"
            stroke="#7DD3FC"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Arrow Head Bevel / Facet line */}
          <path
            d="M 78 22 L 59 36"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return renderIcon();
  }

  // Full / Horizontal / Compact Logo with Typography
  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none min-w-0 ${className}`}>
      {renderIcon()}

      <div className="flex flex-col justify-center leading-none min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="font-extrabold tracking-[0.06em] sm:tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 drop-shadow-sm font-sans text-sm sm:text-base md:text-lg whitespace-nowrap">
            QUANTUM<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 font-black">FLUX</span>
          </span>
          <span className="hidden sm:inline-block text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest px-1 sm:px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 flex-shrink-0">
            PRO
          </span>
        </div>

        {showSubtitle && (
          <span className="hidden sm:block text-[9px] sm:text-[10px] md:text-[11px] font-medium tracking-[0.06em] sm:tracking-[0.08em] text-slate-400 mt-0.5 sm:mt-1 uppercase font-sans truncate">
            Gestion de Mobilité Nouvelle Génération
          </span>
        )}
      </div>
    </div>
  );
};
