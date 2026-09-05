import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus,
  Key,
  RotateCcw,
  CalendarPlus,
  UserPlus,
  QrCode,
  X,
  ScanLine,
  Wrench,
} from 'lucide-react';

interface QuickActionFABProps {
  onOpenBookingWizard?: () => void;
  onOpenNewClient?: () => void;
  onOpenPlateScanner?: () => void;
}

export const QuickActionFAB: React.FC<QuickActionFABProps> = ({
  onOpenBookingWizard,
  onOpenNewClient,
  onOpenPlateScanner,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setActiveTab, bookings, setSelectedBookingForCheckIn, setSelectedBookingForCheckOut } = useApp();
  const {
    canCreateBooking,
    canPerformCheckInOut,
    canManageClients,
    canPerformMaintenanceServicing,
    isAgentTechnique
  } = useAuth();

  const handleAction = (callback?: () => void) => {
    setIsOpen(false);
    if (callback) callback();
  };

  const handleStartAnyCheckIn = () => {
    const readyBooking = bookings.find(b => b.status === 'CONFIRMED');
    if (readyBooking) {
      setSelectedBookingForCheckIn(readyBooking);
      setActiveTab('checkin');
    } else {
      setActiveTab('bookings');
    }
  };

  const handleStartAnyCheckOut = () => {
    const activeBooking = bookings.find(b => b.status === 'IN_PROGRESS');
    if (activeBooking) {
      setSelectedBookingForCheckOut(activeBooking);
      setActiveTab('checkout');
    } else {
      setActiveTab('bookings');
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Action Menu Container */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 select-none pointer-events-none">
        {/* Sub-action buttons */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            {/* Agent Technique Action: Entretien / Vidange */}
            {canPerformMaintenanceServicing && (
              <button
                type="button"
                onClick={() => handleAction(() => setActiveTab('maintenance'))}
                className="min-h-[56px] px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl flex items-center gap-3 active:scale-95 transition-all border border-amber-400/30 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <span>Entretien / Vidange</span>
              </button>
            )}

            {/* Check-in (Remise des clés) */}
            {canPerformCheckInOut && (
              <button
                type="button"
                onClick={() => handleAction(handleStartAnyCheckIn)}
                className="min-h-[56px] px-5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl flex items-center gap-3 active:scale-95 transition-all border border-green-400/30 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <span>Nouveau Check-in (Départ)</span>
              </button>
            )}

            {/* Check-out (Retour véhicule) */}
            {canPerformCheckInOut && (
              <button
                type="button"
                onClick={() => handleAction(handleStartAnyCheckOut)}
                className="min-h-[56px] px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl flex items-center gap-3 active:scale-95 transition-all border border-blue-400/30 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <span>Nouveau Check-out (Retour)</span>
              </button>
            )}

            {/* Nouvelle Réservation */}
            {canCreateBooking && (
              <button
                type="button"
                onClick={() => handleAction(onOpenBookingWizard)}
                className="min-h-[56px] px-5 rounded-xl bg-[#151B30] hover:bg-[#1C2542] text-white font-bold text-xs uppercase tracking-wider shadow-xl flex items-center gap-3 active:scale-95 transition-all border border-gray-700 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <CalendarPlus className="w-4 h-4 text-white" />
                </div>
                <span className="whitespace-nowrap">Nouvelle Réservation</span>
              </button>
            )}

            {/* Scanner Plaque / QR */}
            <button
              type="button"
              onClick={() => handleAction(onOpenPlateScanner)}
              className="min-h-[56px] px-5 rounded-xl bg-[#151B30] hover:bg-[#1C2542] text-cyan-300 font-bold text-xs uppercase tracking-wider shadow-xl flex items-center gap-3 active:scale-95 transition-all border border-cyan-500/40 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-900/40 flex items-center justify-center">
                <ScanLine className="w-4 h-4 text-cyan-400" />
              </div>
              <span>Scanner Plaque / QR</span>
            </button>

            {/* Nouveau Client */}
            {canManageClients && (
              <button
                type="button"
                onClick={() => handleAction(onOpenNewClient)}
                className="min-h-[56px] px-5 rounded-xl bg-[#151B30] hover:bg-[#1C2542] text-gray-200 font-bold text-xs uppercase tracking-wider shadow-xl flex items-center gap-3 active:scale-95 transition-all border border-gray-800 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0A0E1A] border border-gray-800 flex items-center justify-center text-gray-300">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>Nouveau Client</span>
              </button>
            )}
          </div>
        )}

        {/* Primary FAB Button (64x64px min, tactile feedback) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`pointer-events-auto w-16 h-16 min-w-[64px] min-h-[64px] rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all duration-200 active:scale-90 cursor-pointer ${
            isOpen
              ? 'bg-rose-600 rotate-45 shadow-rose-950/60'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/60 border border-blue-400/30'
          }`}
          aria-label="Actions rapides"
        >
          <Plus className="w-8 h-8 stroke-[2.5]" />
        </button>
      </div>
    </>
  );
};
