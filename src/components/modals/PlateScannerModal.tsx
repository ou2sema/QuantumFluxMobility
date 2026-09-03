import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useBooking } from '../../hooks/useBooking';
import { useCamera } from '../../hooks/useCamera';
import {
  Scan,
  X,
  Camera,
  Check,
  RotateCcw,
  Key,
  Car,
  Search,
  Sparkles
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
  const { vehicles, bookings, setSelectedBookingForCheckIn, setSelectedBookingForCheckOut, setActiveTab } = useApp();
  const { startCheckInFlow, startCheckOutFlow } = useBooking();
  const { videoRef, isCameraActive, error, startCamera, stopCamera } = useCamera();

  const [recognizedPlate, setRecognizedPlate] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState('');

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const simulateScan = (plate: string) => {
    setRecognizedPlate(plate);
  };

  const matchedVehicle = recognizedPlate
    ? vehicles.find(v => v.plate.toUpperCase().replace('-', '') === recognizedPlate.toUpperCase().replace('-', ''))
    : null;

  const matchedBooking = matchedVehicle
    ? bookings.find(b => b.vehicleId === matchedVehicle.id && (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'))
    : null;

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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Area */}
        <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-cyan-500/50">
            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-slate-400">Pointez la caméra vers la plaque d'immatriculation</p>
              </div>
            )}

            {/* Target Laser Overlay */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-14 border-2 border-dashed border-cyan-400 rounded-xl bg-cyan-500/10 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                Cadrez la plaque ici
              </span>
            </div>
          </div>

          {/* Quick Mock Plate Recognition Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Simulation Détection OCR Immédiate
            </span>
            <div className="grid grid-cols-2 gap-2">
              {vehicles.slice(0, 4).map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => simulateScan(v.plate)}
                  className="min-h-[48px] p-2 rounded-xl bg-[#131B2E] border border-slate-700 text-left flex items-center justify-between active:scale-95 transition-all"
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
                <img src={matchedVehicle.images[0]} alt={matchedVehicle.model} className="w-14 h-14 rounded-xl object-cover" />
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
