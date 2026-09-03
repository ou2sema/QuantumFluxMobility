import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Printer,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import {
  downloadContractPdf,
  printContractDocument,
} from '../../utils/contractPdfGenerator';

interface InvoiceModalProps {
  bookingId: string;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ bookingId, onClose }) => {
  const { bookings, currentAgency, vehicles, clients } = useApp();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const booking = bookings.find(b => b.id === bookingId) || bookings[0];
  const vehicle = vehicles.find(v => v.id === booking?.vehicleId);
  const client = clients.find(c => c.id === booking?.clientId);

  if (!booking) return null;

  const invoiceNumber = `INV-2026-${booking.bookingNumber.replace('BK-2026-', '')}`;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setFeedback(null);
    try {
      const filename = downloadContractPdf({
        booking,
        agency: currentAgency,
        vehicle,
        client,
      });
      setFeedback({
        type: 'success',
        message: `Fichier ${filename} téléchargé avec succès !`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Erreur génération PDF:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Erreur lors de la génération du contrat PDF.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    setFeedback(null);
    try {
      await printContractDocument({
        booking,
        agency: currentAgency,
        vehicle,
        client,
      });
      setFeedback({
        type: 'success',
        message: 'Fenêtre d\'impression prête (ou PDF généré).',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Erreur impression:', err);
      // Fallback
      handleDownloadPdf();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="pt-safe px-5 py-4 bg-[#131E38] border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Contrat de Location & Facture
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Valide
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">{invoiceNumber}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-90"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback notification if triggered */}
        {feedback && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 no-print ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Printable Contract Document View */}
        <div
          id="contract-printable-area"
          className="p-6 flex-1 overflow-y-auto flex flex-col gap-5 text-slate-300 text-xs printable-document"
        >
          {/* Top Agency / Client info */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-black text-white">{currentAgency.name}</h3>
              </div>
              <p className="text-slate-400 mt-1">{currentAgency.address}</p>
              <p className="text-slate-400">{currentAgency.phone} • {currentAgency.email}</p>
              <p className="font-mono text-[11px] text-slate-500 mt-1">SIRET: 894 120 442 00019 • TVA: FR48894120442</p>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                {invoiceNumber}
              </span>
              <p className="text-slate-400 mt-1">Date : 02/09/2026</p>
              <p className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Statut : {booking.paymentStatus === 'PAID' ? 'PAYÉ (Acquitté)' : 'EN ATTENTE'}
              </p>
            </div>
          </div>

          {/* Client & Vehicle Summary Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#131B2E] p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Locataire Principal</span>
              <p className="font-extrabold text-white text-sm mt-0.5">{booking.clientName}</p>
              <p className="text-slate-300 mt-0.5">{booking.clientPhone}</p>
              <p className="text-slate-300">{booking.clientEmail}</p>
              <p className="font-mono text-cyan-400 mt-1 font-semibold">
                Permis : {client?.licenseNumber || '26FR991823'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Véhicule Loué</span>
              <p className="font-extrabold text-white text-sm mt-0.5">{booking.vehicleName}</p>
              <p className="font-mono font-bold text-cyan-400">Plaque : {booking.vehiclePlate}</p>
              <p className="text-slate-300">Période : {booking.startDate} au {booking.endDate} ({booking.durationDays}j)</p>
              <p className="text-amber-400 font-bold mt-1">Caution bloquée : {booking.depositAmount} DT</p>
            </div>
          </div>

          {/* Detailed Pricing Breakdown */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Détail des Prestations</span>
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#0A0E1A]">
              <div className="grid grid-cols-12 p-3 bg-[#131B2E] font-bold text-slate-300 text-[11px] border-b border-slate-800 print-table">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-center">Qté</span>
                <span className="col-span-2 text-right">P.U. HT</span>
                <span className="col-span-2 text-right">Total HT</span>
              </div>

              <div className="grid grid-cols-12 p-3 border-b border-slate-800/60 items-center">
                <div className="col-span-6">
                  <p className="text-white font-medium">Location véhicule ({booking.vehicleName})</p>
                  <p className="text-[10px] text-slate-400">Kilométrage contractuel inclus ({booking.includedKm || 250} km/j)</p>
                </div>
                <span className="col-span-2 text-center font-mono">{booking.durationDays} j</span>
                <span className="col-span-2 text-right font-mono">{(booking.dailyRate / 1.2).toFixed(2)} DT</span>
                <span className="col-span-2 text-right font-mono">{(booking.rentalSubtotal / 1.2).toFixed(2)} DT</span>
              </div>

              {booking.extrasTotal > 0 && (
                <div className="grid grid-cols-12 p-3 border-b border-slate-800/60 items-center">
                  <div className="col-span-6">
                    <p className="text-white font-medium">Pack Assurance Tous Risques & Zéro Franchise</p>
                    <p className="text-[10px] text-slate-400">Couverture complète et rachat de franchise</p>
                  </div>
                  <span className="col-span-2 text-center font-mono">1</span>
                  <span className="col-span-2 text-right font-mono">{(booking.extrasTotal / 1.2).toFixed(2)} DT</span>
                  <span className="col-span-2 text-right font-mono">{(booking.extrasTotal / 1.2).toFixed(2)} DT</span>
                </div>
              )}

              {/* Totals */}
              <div className="p-4 bg-[#131B2E] flex flex-col gap-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Hors Taxes</span>
                  <span>{(booking.totalAmount / 1.2).toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TVA (20%)</span>
                  <span>{(booking.totalAmount - (booking.totalAmount / 1.2)).toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between text-base font-black text-emerald-400 pt-2 border-t border-slate-800">
                  <span>TOTAL TTC</span>
                  <span>{booking.totalAmount.toFixed(2)} DT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal mentions preview */}
          <div className="p-3 bg-[#131B2E]/60 border border-slate-800/80 rounded-xl text-[10.5px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300">Conditions de restitution :</p>
            <p>Le véhicule doit être retourné avec le même volume de carburant qu'au départ. Tout retard supérieur à 60 minutes entraîne une journée supplémentaire de facturation. La caution de {booking.depositAmount} DT est restituée après validation contradictoire du check-out.</p>
          </div>

          {/* Signature Boxes preview */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 border border-slate-800 rounded-xl bg-[#131B2E]/40 flex flex-col justify-between h-24">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Pour l'Agence</p>
                <p className="text-[9px] text-slate-400 italic">Signature & Cachet commercial</p>
              </div>
              <p className="text-[10px] font-mono text-emerald-400 font-bold">✓ CERTIFIÉ & HORODATÉ</p>
            </div>
            <div className="p-3 border border-slate-800 rounded-xl bg-[#131B2E]/40 flex flex-col justify-between h-24">
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Le Locataire</p>
                <p className="text-[9px] text-slate-400 italic">Mention "Bon pour accord"</p>
              </div>
              <p className="text-xs font-semibold text-white">{booking.clientName}</p>
            </div>
          </div>
        </div>

        {/* Footer with both PDF and Print buttons */}
        <div className="pb-safe px-5 py-4 bg-[#131E38] border-t border-slate-800 flex flex-wrap items-center gap-2.5 sm:gap-3 no-print">
          <TactileButton
            variant="outline"
            className="flex-1 min-w-[90px]"
            onClick={onClose}
          >
            Fermer
          </TactileButton>

          <TactileButton
            variant="outline"
            className="flex-1 min-w-[140px] border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            icon={Download}
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
          >
            {isGeneratingPdf ? 'Génération...' : 'Télécharger PDF'}
          </TactileButton>

          <TactileButton
            variant="primary"
            className="flex-1 min-w-[140px] font-black"
            icon={Printer}
            disabled={isPrinting}
            onClick={handlePrint}
          >
            {isPrinting ? 'Préparation...' : 'Imprimer'}
          </TactileButton>
        </div>
      </div>
    </div>
  );
};
