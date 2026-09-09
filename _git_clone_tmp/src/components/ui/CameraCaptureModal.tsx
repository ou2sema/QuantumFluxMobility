import React, { useState, useEffect } from 'react';
import { MandatoryPhotos } from '../../types';
import { useCamera } from '../../hooks/useCamera';
import { Camera, Check, ChevronLeft, ChevronRight, RefreshCw, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { TactileButton } from './TactileButton';

interface CameraCaptureModalProps {
  photos: MandatoryPhotos;
  onSavePhotos: (photos: MandatoryPhotos) => void;
  onClose: () => void;
  title?: string;
}

type PhotoKey = keyof MandatoryPhotos;

interface AngleInfo {
  key: PhotoKey;
  label: string;
  description: string;
  guideIcon: string;
  presetUrl: string;
}

const ANGLES: AngleInfo[] = [
  {
    key: 'front',
    label: '1. Face Avant',
    description: 'Cadrez la calandre, plaque d’immatriculation et optiques avant',
    guideIcon: '🚗',
    presetUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
  },
  {
    key: 'rear',
    label: '2. Face Arrière',
    description: 'Cadrez le coffre, feux arrière et pare-chocs bas',
    guideIcon: '🚘',
    presetUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80',
  },
  {
    key: 'left',
    label: '3. Profil Gauche',
    description: 'Portières conducteur, aile avant/arrière et rétroviseur',
    guideIcon: '🚙',
    presetUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
  },
  {
    key: 'right',
    label: '4. Profil Droit',
    description: 'Portières passager, bas de caisse et trappe à carburant',
    guideIcon: '🚙',
    presetUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
  },
  {
    key: 'interior',
    label: '5. Habitacle & Sièges',
    description: 'Vue d’ensemble des sièges, volant et console centrale',
    guideIcon: '💺',
    presetUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
  },
  {
    key: 'dashboard',
    label: '6. Tableau de bord (KM / Jauge)',
    description: 'Compteur kilométrique et jauge de carburant allumée',
    guideIcon: '⏱️',
    presetUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80',
  },
];

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  photos: initialPhotos,
  onSavePhotos,
  onClose,
  title = '6 Photos Obligatoires du Véhicule',
}) => {
  const [currentPhotos, setCurrentPhotos] = useState<MandatoryPhotos>(initialPhotos);
  const [currentAngleIndex, setCurrentAngleIndex] = useState<number>(0);
  const { videoRef, isCameraActive, startCamera, stopCamera, capturePhoto, error } = useCamera();

  const currentAngle = ANGLES[currentAngleIndex];

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleTakeShutterPhoto = () => {
    const shot = capturePhoto();
    if (shot) {
      setCurrentPhotos(prev => ({
        ...prev,
        [currentAngle.key]: shot,
      }));
      // Advance to next angle if available
      if (currentAngleIndex < ANGLES.length - 1) {
        setCurrentAngleIndex(prev => prev + 1);
      }
    } else {
      // Fallback: use realistic high-res mock photo
      handleUsePreset();
    }
  };

  const handleUsePreset = () => {
    setCurrentPhotos(prev => ({
      ...prev,
      [currentAngle.key]: currentAngle.presetUrl,
    }));
    if (currentAngleIndex < ANGLES.length - 1) {
      setCurrentAngleIndex(prev => prev + 1);
    }
  };

  const handleAutoFillAll = () => {
    const allFilled: MandatoryPhotos = {
      front: ANGLES[0].presetUrl,
      rear: ANGLES[1].presetUrl,
      left: ANGLES[2].presetUrl,
      right: ANGLES[3].presetUrl,
      interior: ANGLES[4].presetUrl,
      dashboard: ANGLES[5].presetUrl,
    };
    setCurrentPhotos(allFilled);
  };

  const isAllCaptured = Object.values(currentPhotos).every(url => Boolean(url));
  const capturedCount = Object.values(currentPhotos).filter(Boolean).length;

  const handleSaveAndExit = () => {
    onSavePhotos(currentPhotos);
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0E1A] flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="pt-safe px-4 py-3 bg-[#10172A] border-b border-slate-800 flex items-center justify-between z-10">
        <div>
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            <span>Inspection Terrain</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
              {capturedCount}/6
            </span>
          </span>
          <h3 className="text-base font-extrabold text-white">{title}</h3>
        </div>

        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 active:scale-90 transition-transform"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Thumbnails Carousel */}
      <div className="bg-[#0D1322] px-3 py-2 border-b border-slate-800 flex gap-2 overflow-x-auto select-none">
        {ANGLES.map((angle, idx) => {
          const hasPhoto = Boolean(currentPhotos[angle.key]);
          const isCurrent = idx === currentAngleIndex;

          return (
            <button
              key={angle.key}
              type="button"
              onClick={() => setCurrentAngleIndex(idx)}
              className={`min-w-[56px] h-14 rounded-xl relative border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-150 flex-shrink-0 ${
                isCurrent
                  ? 'border-blue-500 bg-blue-950/60 scale-105'
                  : hasPhoto
                  ? 'border-emerald-500/80 bg-[#152037]'
                  : 'border-slate-800 bg-[#0F172A]'
              }`}
            >
              {hasPhoto ? (
                <img
                  src={currentPhotos[angle.key]}
                  alt={angle.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm">{angle.guideIcon}</span>
              )}

              {hasPhoto && (
                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Camera Live Viewfinder or Preview */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {currentPhotos[currentAngle.key] ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentPhotos[currentAngle.key]}
              alt={currentAngle.label}
              className="w-full h-full object-contain"
            />
            {/* Overlay badge */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/50 flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Check className="w-4 h-4" />
              <span>Photo validée pour {currentAngle.label}</span>
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentPhotos(prev => ({ ...prev, [currentAngle.key]: '' }))
              }
              className="absolute bottom-4 left-4 min-h-[48px] px-4 rounded-xl bg-black/70 backdrop-blur-md border border-slate-700 text-white text-xs font-bold flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reprendre la photo</span>
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Alignment Grid / Car Silhouette Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-white/40 rounded-3xl pointer-events-none flex flex-col items-center justify-between p-4">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-blue-300">
                {currentAngle.label}
              </div>
              <span className="text-4xl opacity-50">{currentAngle.guideIcon}</span>
              <p className="bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-xl text-center text-xs text-white max-w-xs font-medium">
                {currentAngle.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Shutter & Controls Section (Strict 72x72px shutter button) */}
      <div className="pb-safe px-4 py-4 bg-[#10172A] border-t border-slate-800 flex flex-col gap-3">
        {/* Navigation Arrows + 72x72 Shutter Center */}
        <div className="flex items-center justify-between px-2">
          {/* Previous Angle */}
          <button
            type="button"
            disabled={currentAngleIndex === 0}
            onClick={() => setCurrentAngleIndex(prev => Math.max(0, prev - 1))}
            className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl bg-[#1A2338] border border-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30 active:scale-95"
            aria-label="Angle précédent"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Shutter Capture Button - Strict 72x72px */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleTakeShutterPhoto}
              className="w-[72px] h-[72px] min-w-[72px] min-h-[72px] rounded-full bg-white border-4 border-blue-500 shadow-xl shadow-blue-500/30 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
              aria-label="Prendre la photo"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <Camera className="w-7 h-7" />
              </div>
            </button>
            <span className="text-[11px] font-bold text-slate-400 mt-1">
              Capture ({currentAngleIndex + 1}/6)
            </span>
          </div>

          {/* Next Angle */}
          <button
            type="button"
            disabled={currentAngleIndex === ANGLES.length - 1}
            onClick={() =>
              setCurrentAngleIndex(prev => Math.min(ANGLES.length - 1, prev + 1))
            }
            className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl bg-[#1A2338] border border-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30 active:scale-95"
            aria-label="Angle suivant"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Simulator & Validate Actions */}
        <div className="flex gap-2">
          {!isAllCaptured && (
            <button
              type="button"
              onClick={handleAutoFillAll}
              className="min-h-[48px] px-3.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 flex-1"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Simuler 6 Photos HD</span>
            </button>
          )}

          <TactileButton
            variant="success"
            className="flex-1"
            disabled={!isAllCaptured}
            icon={Check}
            onClick={handleSaveAndExit}
          >
            Valider les {capturedCount}/6 Photos
          </TactileButton>
        </div>
      </div>
    </div>
  );
};
