import React, { useState } from 'react';
import { Booking, Vehicle } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  X,
  Car,
  Calendar,
  DollarSign,
  RotateCcw,
  CheckCircle2,
  Info,
  User,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';

interface CancelBookingModalProps {
  booking: Booking | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_REASONS = [
  'Demande du client (annulation volontaire)',
  'Client non présenté (No-show à l’agence)',
  'Imprévu / Problème de transport / Vol retardé',
  'Paiement / Empreinte bancaire refusée',
  'Véhicule indisponible / Problème technique',
  'Autre motif',
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  booking,
  onClose,
  onSuccess,
}) => {
  const { cancelBooking, vehicles, currentUser } = useApp();

  const [selectedPresetReason, setSelectedPresetReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isRefundApplicable, setIsRefundApplicable] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(() => {
    if (!booking) return 0;
    return booking.paidAmount || (booking.paymentStatus === 'PAID' ? booking.totalAmount : 0);
  });
  const [cancellationFee, setCancellationFee] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!booking) return null;

  const vehicle: Vehicle | undefined = vehicles.find((v) => v.id === booking.vehicleId);
  const isPaid = booking.paymentStatus === 'PAID' || (booking.paidAmount && booking.paidAmount > 0);
  const effectiveReason = customReason.trim()
    ? customReason.trim()
    : selectedPresetReason;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const refundToApply = isPaid && isRefundApplicable ? refundAmount : 0;
      const feeToApply = isPaid && isRefundApplicable ? cancellationFee : 0;

      const res = await cancelBooking(
        booking.id,
        effectiveReason,
        refundToApply,
        feeToApply,
        currentUser?.name || 'Agent'
      );

      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de l'annulation.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur inattendue lors de l'annulation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="cancel-booking-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#0E1528] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-950/40 via-[#161F38] to-[#161F38] border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Annuler la Réservation
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  {booking.bookingNumber}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Cette action libère automatiquement le véhicule pour le planning.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-cancel-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Reservation recap card */}
          <div className="p-3.5 rounded-xl bg-[#151D33] border border-gray-800 space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">
                    {booking.vehicleName}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400">
                    {booking.vehiclePlate}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400 font-mono">
                  {(booking?.totalAmount || 0).toFixed(2)} DT
                </div>
                <div className="text-[10px] text-gray-400">
                  {booking.paymentStatus === 'PAID' ? 'Payé' : 'Paiement en attente'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-gray-300">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate">{booking.clientName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{booking.startDate} → {booking.endDate}</span>
              </div>
            </div>
          </div>

          {/* Automatic vehicle release guarantee notice */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-300">
              <span className="font-bold">Libération immédiate :</span> Dès confirmation, le véhicule{' '}
              <span className="font-mono font-bold text-white">{booking.vehicleName}</span> (
              {booking.vehiclePlate}) repassera en statut{' '}
              <span className="font-bold underline">DISPONIBLE</span> dans la flotte et le calendrier.
            </div>
          </div>

          {/* Reason selection */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Motif de l’annulation <span className="text-red-400">*</span>
            </label>
            <div className="space-y-1.5">
              {COMMON_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => setSelectedPresetReason(reason)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                    selectedPresetReason === reason
                      ? 'bg-red-500/15 border-red-500/50 text-white shadow-sm'
                      : 'bg-[#151D33]/60 border-gray-800 text-gray-300 hover:bg-[#1A233D] hover:border-gray-700'
                  }`}
                >
                  <span>{reason}</span>
                  {selectedPresetReason === reason && (
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-2.5">
              <input
                type="text"
                placeholder="Précisions ou commentaire complémentaire..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-[#12182B] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Refund / Financial Adjustment (if paid) */}
          {isPaid && (
            <div className="p-3.5 rounded-xl bg-[#141C31] border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Remboursement / Gestion financière
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={isRefundApplicable}
                    onChange={(e) => setIsRefundApplicable(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-gray-900 border-gray-700 focus:ring-0"
                  />
                  <span>Traiter un remboursement</span>
                </label>
              </div>

              {isRefundApplicable && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1">Montant à rembourser (DT)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0D1322] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Frais de retenue / Pénalité (DT)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={cancellationFee}
                      onChange={(e) => setCancellationFee(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0D1322] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-[#131A2F] border-t border-gray-800 flex items-center justify-end gap-2.5">
          <TactileButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Conserver la réservation
          </TactileButton>

          <TactileButton
            type="button"
            variant="danger"
            onClick={handleConfirmCancel}
            disabled={isSubmitting}
            loading={isSubmitting}
            icon={AlertTriangle}
            className="text-xs font-black bg-red-600 hover:bg-red-700 text-white"
          >
            Confirmer l’annulation
          </TactileButton>
        </div>
      </div>
    </div>
  );
};
