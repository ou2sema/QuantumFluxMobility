import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'warning';
  size?: 'normal' | 'large' | 'icon';
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'normal',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'tactile-btn font-bold uppercase tracking-wider inline-flex items-center justify-center whitespace-nowrap rounded-xl transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none select-none';

  // Strict Rule: Minimum 56px height for all buttons
  const sizeClasses = {
    normal: 'min-h-[56px] px-6 text-sm gap-2.5',
    large: 'min-h-[64px] px-8 text-base font-black tracking-widest gap-3.5',
    icon: 'w-14 h-14 min-h-[56px] min-w-[56px] p-0 rounded-xl',
  }[size];

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-950/40 border border-blue-400/20',
    secondary: 'bg-[#151B30] text-gray-200 hover:bg-[#1C2542] active:bg-[#0E1322] border border-gray-800 shadow-md',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-lg shadow-rose-950/40 border border-rose-400/20',
    success: 'bg-green-600 text-white hover:bg-green-500 active:bg-green-700 shadow-lg shadow-green-950/40 border border-green-400/20',
    warning: 'bg-orange-500 text-white hover:bg-orange-400 active:bg-orange-600 shadow-lg shadow-orange-950/40 border border-orange-400/20',
    outline: 'bg-transparent text-gray-300 border border-gray-700 hover:border-gray-500 hover:text-white active:bg-gray-800/40',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800/40 active:bg-gray-800/70',
  }[variant];

  const widthClass = fullWidth ? 'w-full' : '';

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="w-5 h-5 flex-shrink-0" />;
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Traitement...</span>
        </div>
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          {children}
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </button>
  );
};
