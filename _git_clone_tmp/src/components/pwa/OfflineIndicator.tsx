import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-18 md:bottom-4 left-4 z-40 flex items-center gap-2.5 rounded-xl bg-amber-600/95 border border-amber-400/50 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-pulse"
    >
      <WifiOff className="w-4 h-4 text-amber-200" />
      <span>{t('offline.banner')}</span>
    </div>
  );
};
