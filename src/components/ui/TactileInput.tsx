import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface TactileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  clearable?: boolean;
  onClear?: () => void;
  numericMode?: boolean;
  suffix?: string;
  prefix?: string;
}

export const TactileInput: React.FC<TactileInputProps> = ({
  label,
  error,
  hint,
  icon: Icon,
  clearable = false,
  onClear,
  numericMode = false,
  suffix,
  prefix,
  className = '',
  value,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-slate-300 flex items-center justify-between">
          <span>{label}</span>
          {hint && <span className="text-xs text-slate-400 font-normal">{hint}</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}

        {prefix && (
          <span className="absolute left-4 text-slate-400 font-semibold select-none">
            {prefix}
          </span>
        )}

        <input
          id={inputId}
          value={value}
          inputMode={numericMode ? 'numeric' : props.inputMode}
          pattern={numericMode ? '[0-9]*' : props.pattern}
          className={`
            w-full min-h-[56px] px-4 rounded-2xl bg-[#131B2E] border-2 
            ${error ? 'border-rose-500 text-rose-100 focus:border-rose-400' : 'border-slate-700/80 text-white focus:border-blue-500'}
            placeholder-slate-500 font-medium text-base tracking-wide
            focus:outline-none focus:ring-4 focus:ring-blue-500/20 
            transition-all duration-150
            ${Icon ? 'pl-12' : prefix ? 'pl-10' : 'pl-4'}
            ${clearable || suffix ? 'pr-12' : 'pr-4'}
            ${numericMode ? 'font-mono text-lg' : ''}
            ${className}
          `}
          {...props}
        />

        {suffix && (
          <span className="absolute right-4 text-slate-400 font-bold select-none text-sm">
            {suffix}
          </span>
        )}

        {clearable && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3.5 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-transform"
            aria-label="Effacer le contenu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-400 flex items-center gap-1 mt-0.5">
          <span>⚠️ {error}</span>
        </p>
      )}
    </div>
  );
};
