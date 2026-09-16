import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useBooking } from '../../hooks/useBooking';
import { useCamera } from '../../hooks/useCamera';
import {
  Scan,
  X,
  Camera,
  RotateCcw,
  Key,
  Car,
  Search,
  Sparkles,
  SwitchCamera,
  Zap,
  ZapOff,
  AlertCircle
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';

interface PlateScannerModalProps {
  onClose: () => void;
  onVehicleSelected?: (vehicleId: string) => void;
}

export const PlateScannerModal: React.FC<PlateScannerModalProps> = ({
  onClose,
  onVehicleSelected,
}) => {
  const { vehicles, bookings } = useApp();
  const { startCheckInFlow, startCheckOutFlow } = useBooking();
  const {
    videoRef,
    isCameraActive,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    toggleTorch,
    isTorchOn,
    hasTorch,
    capturePhoto,
  } = useCamera('environment');

  const [recognizedPlate, setRecognizedPlate] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    startCamera('environment');
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const simulateScan = (plate: string) => {
    setRecognizedPlate(plate);
  };

  const handleCaptureAndScan = () => {
    setIsAnalyzing(true);
    const photo = capturePhoto();
    // Simulate OCR scanning process from live video frame
    setTimeout(() => {
      setIsAnalyzing(false);
      // Try to find matching vehicle or default to first available vehicle if unassigned
      if (vehicles.length > 0) {
        const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        setRecognizedPlate(randomVehicle.plate);
      }
    }, 600);
  };

  const normalizePlate = (str: string) => str.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const matchedVehicle = recognizedPlate
    ? vehicles.find(v => normalizePlate(v.plate) === normalizePlate(recognizedPlate))
    : null;

  const matchedBooking = matchedVehicle
    ? bookings.find(b => b.vehicleId === matchedVehicle.id && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'))
    : null;

  const filteredVehicles = manualSearch.trim()
    ? vehicles.filter(v =>
        normalizePlate(v.plate).includes(normalizePlate(manualSearch)) ||
        `${v.brand} ${v.model}`.toLowerCase().includes(manualSearch.toLowerCase())
      )
    : vehicles.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="pt-safe px-5 py-4 bg-[#131E38] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-extrabold text-white">Scanner Plaque / QR Code</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Area */}
        <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
          {/* Camera Frame Container - Video is ALWAYS in DOM so videoRef is never null */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-cyan-500/50 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isCameraActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
              }`}
            />

            {/* Placeholder / Error State when camera not streaming */}
            {!isCameraActive && (
              <div className="text-center p-6 flex flex-col items-center justify-center z-10">
                {error ? (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-9 h-9 text-rose-400" />
                    <p className="text-xs text-rose-300 font-semibold max-w-xs">{error}</p>
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="mt-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold active:scale-95 transition-all shadow-lg"
                    >
                      Réessayer la caméra
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-cyan-400 animate-pulse" />
                    <p className="text-xs text-slate-300 font-medium">Activation du flux vidéo...</p>
                    <p className="text-[11px] text-slate-500">Pointez l'objectif vers la plaque d'immatriculation</p>
                  </div>
                )}
              </div>
            )}

            {/* On-Camera Quick Controls (Switch camera, Flashlight) */}
            {isCameraActive && (
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                      isTorchOn ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/50' : 'bg-black/60 text-slate-200 border border-white/20'
                    }`}
                    title="Lampe torche"
                    aria-label="Lampe torche"
                  >
                    {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={switchCamera}
                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-slate-200 border border-white/20 flex items-center justify-center active:scale-90 transition-transform"
                  title="Changer de caméra"
                  aria-label="Changer de caméra"
                >
                  <SwitchCamera className="w-4 h-4 text-cyan-300" />
                </button>
              </div>
            )}

            {/* Target Laser Overlay */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-14 border-2 border-dashed border-cyan-400 rounded-xl bg-cyan-500/10 flex items-center justify-center pointer-events-none z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                Cadrez la plaque ici
              </span>
              {/* Laser scanning beam */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] animate-pulse" />
            </div>
          </div>

          {/* Scanner Action Trigger */}
          {isCameraActive && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCaptureAndScan}
                disabled={isAnalyzing}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyse OCR en cours...' : 'Capturer & Scanner Plaque'}</span>
              </button>
            </div>
          )}

          {/* Search or Quick Select Plate */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualSearch}
                onChange={e => setManualSearch(e.target.value)}
                placeholder="Recherche directe (ex: 214 TN 5678)..."
                className="w-full pl-9 pr-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                {manualSearch ? 'Résultats correspondants' : 'Simulation Détection OCR Immédiate'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {filteredVehicles.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => simulateScan(v.plate)}
                  className={`min-h-[48px] p-2 rounded-xl border text-left flex items-center justify-between active:scale-95 transition-all ${
                    recognizedPlate === v.plate
                      ? 'bg-cyan-950/60 border-cyan-400'
                      : 'bg-[#131B2E] border-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-mono text-xs font-black text-cyan-400">{v.plate}</p>
                    <p className="text-[10px] text-slate-300">{v.brand} {v.model}</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Matched Vehicle Card */}
          {matchedVehicle && (
            <div className="p-4 rounded-2xl bg-[#131E38] border-2 border-cyan-500 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Véhicule Reconnu</span>
                  <h4 className="text-base font-extrabold text-white">
                    {matchedVehicle.brand} {matchedVehicle.model} ({matchedVehicle.plate})
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Statut : <strong className="text-cyan-300">{matchedVehicle.status}</strong>
                  </p>
                </div>
                {matchedVehicle.images?.[0] && (
                  <img src={matchedVehicle.images[0]} alt={matchedVehicle.model} className="w-14 h-14 rounded-xl object-cover" />
                )}
              </div>

              {matchedBooking ? (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  {matchedBooking.status === 'CONFIRMED' && (
                    <TactileButton
                      variant="success"
                      icon={Key}
                      className="flex-1"
                      onClick={() => {
                        onClose();
                        startCheckInFlow(matchedBooking);
                      }}
                    >
                      Démarrer Check-in
                    </TactileButton>
                  )}

                  {matchedBooking.status === 'IN_PROGRESS' && (
                    <TactileButton
                      variant="primary"
                      icon={RotateCcw}
                      className="flex-1"
                      onClick={() => {
                        onClose();
                        startCheckOutFlow(matchedBooking);
                      }}
                    >
                      Faire Check-out
                    </TactileButton>
                  )}
                </div>
              ) : (
                <TactileButton
                  variant="outline"
                  icon={Car}
                  onClick={() => {
                    onClose();
                    if (onVehicleSelected) onVehicleSelected(matchedVehicle.id);
                  }}
                >
                  Voir Fiche Véhicule
                </TactileButton>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pb-safe px-5 py-4 bg-[#131E38] border-t border-slate-800">
          <TactileButton variant="outline" onClick={onClose}>
            Fermer
          </TactileButton>
        </div>
      </div>
    </div>
  );
};