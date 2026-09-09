import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useTranslation } from 'react-i18next';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { t } = useTranslation();

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${className}`}
        aria-label={t('nav.installApp')}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{t('nav.installApp')}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${className}`}
          aria-label="Installer sur iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          <span>Installer</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 id="ios-install-title" className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  Installer sur iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-400">1.</span>
                  <span>Touchez le bouton <strong>Partager</strong> dans la barre Safari (icône carré avec flèche).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-400">2.</span>
                  <span>Faites défiler vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-400">3.</span>
                  <span>Appuyez sur <strong>Ajouter</strong> en haut à droite.</span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
