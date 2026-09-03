import React from 'react';
import { BookingStatus, VehicleStatus } from '../../types';

interface StatusBadgeProps {
  status: VehicleStatus | BookingStatus | string;
  size?: 'small' | 'normal' | 'large';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'normal',
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      // Vehicle Statuses
      case 'AVAILABLE':
        return {
          label: 'DISPONIBLE',
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400 animate-pulse',
        };
      case 'RENTED':
        return {
          label: 'LOUÉ / EN COURS',
          bg: 'bg-blue-500/15 border-blue-500/40 text-blue-400',
          dot: 'bg-blue-400',
        };
      case 'MAINTENANCE':
        return {
          label: 'MAINTENANCE',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400',
        };
      case 'UNAVAILABLE':
        return {
          label: 'INDISPONIBLE',
          bg: 'bg-slate-500/15 border-slate-500/40 text-slate-400',
          dot: 'bg-slate-400',
        };

      // Booking Statuses
      case 'CONFIRMED':
        return {
          label: 'CONFIRMÉE',
          bg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400',
          dot: 'bg-indigo-400',
        };
      case 'IN_PROGRESS':
        return {
          label: 'EN COURS',
          bg: 'bg-blue-500/15 border-blue-500/40 text-blue-400',
          dot: 'bg-blue-400 animate-pulse',
        };
      case 'COMPLETED':
        return {
          label: 'CLÔTURÉE',
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400',
        };
      case 'CANCELLED':
        return {
          label: 'ANNULÉE',
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400',
        };
      case 'PENDING':
        return {
          label: 'EN ATTENTE',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400',
        };

      default:
        return {
          label: status,
          bg: 'bg-slate-500/15 border-slate-500/40 text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();

  const sizeClasses = {
    small: 'text-[10px] px-2 py-0.5 font-bold tracking-wider rounded',
    normal: 'text-xs px-2.5 py-1 font-bold tracking-wider rounded-lg',
    large: 'text-sm px-3.5 py-1.5 font-black tracking-widest rounded-lg',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-mono ${config.bg} ${sizeClasses} uppercase whitespace-nowrap shadow-sm select-none ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
