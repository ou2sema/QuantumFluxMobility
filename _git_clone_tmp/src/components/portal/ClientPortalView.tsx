import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, Vehicle, ClientDocument } from '../../types';
import { AutoRentLogo } from '../ui/AutoRentLogo';
import {
  Car,
  Calendar,
  CreditCard,
  Check,
  ShieldCheck,
  MapPin,
  Sparkles,
  CheckCircle2,
  Users,
  Fuel,
  Clock,
  ArrowRight,
  FileText,
  UploadCloud,
  Phone,
  Mail,
  HelpCircle,
  Download,
  AlertTriangle,
  PenTool,
  X,
  Lock
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';
import { SignaturePad } from '../ui/SignaturePad';
import { BookingsService } from '../../services/bookings.service';
import { PaymentsService } from '../../services/payments.service';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';

export const ClientPortalView: React.FC = () => {
  const { bookings, vehicles, currentUser, currentAgency, updateBooking, clients, updateClient } = useApp();

  const [activeModal, setActiveModal] = useState<'NONE' | 'DETAILS' | 'DOCS' | 'SIGN' | 'PAY' | 'CONTACT'>('NONE');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>(['Permis de conduire recto']);

  // Client data isolation: Customer can ONLY access their own bookings!
  const myBookings = bookings.filter(
    (b) => b.clientId === currentUser.id || b.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  // Next upcoming or active booking
  const nextRental = myBookings.find((b) => b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'PENDING') || myBookings[0];
  const nextVehicle = nextRental ? vehicles.find((v) => v.id === nextRental.vehicleId) : null;

  const handleOpenSign = (booking: Booking) => {
    setSelectedBooking(booking);
    setSignatureData(booking.agreementSignatureUrl || null);
    setActiveModal('SIGN');
  };

  const handleSaveSignature = async () => {
    if (!selectedBooking || !signatureData) return;
    setIsSigning(true);
    try {
      await BookingsService.recordSignature(selectedBooking, signatureData, currentUser.name);
      updateBooking({
        ...selectedBooking,
        agreementSigned: true,
        agreementSignatureUrl: signatureData,
        signedAt: new Date().toISOString(),
      });
      setActiveModal('NONE');
      try {
        confetti({ particleCount: 100, spread: 70 });
      } catch (e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigning(false);
    }
  };

  const handleProcessPayment = async (booking: Booking) => {
    try {
      await PaymentsService.recordPayment({
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        clientId: booking.clientId,
        clientName: booking.clientName,
        amount: booking.totalAmount,
        currency: 'TND',
        method: 'ONLINE_TND',
        status: 'PAID',
        reference: `PAY-TUN-${Date.now()}`,
      });

      updateBooking({
        ...booking,
        paymentStatus: 'PAID',
        paidAmount: booking.totalAmount,
      });

      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setActiveModal('NONE');
      }, 2000);
      try {
        confetti({ particleCount: 120, spread: 80 });
      } catch (e) {}
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = (booking: Booking) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(6, 78, 59); // Emerald deep
    doc.text('AUTORENT CAR TUNISIA', 20, 25);
    
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text('Aéroport International de Tunis-Carthage, 1080 Tunis, Tunisie', 20, 32);
    doc.text('Tél : +216 71 754 000 | Email : contact@autorent.tn | www.autorent.tn', 20, 38);
    
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(20, 42, 190, 42);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`CONTRAT DE LOCATION #${booking.bookingNumber}`, 20, 52);

    // Client Info
    doc.setFontSize(11);
    doc.text(`Client : ${booking.clientName}`, 20, 62);
    doc.text(`Email : ${booking.clientEmail}`, 20, 68);
    doc.text(`Téléphone : ${booking.clientPhone}`, 20, 74);

    // Vehicle Info
    doc.text(`Véhicule : ${booking.vehicleName} (${booking.vehiclePlate})`, 110, 62);
    doc.text(`Prise en charge : ${booking.startDate} à ${booking.startTime || '10:00'}`, 110, 68);
    doc.text(`Restitution : ${booking.endDate} à ${booking.endTime || '10:00'}`, 110, 74);
    doc.text(`Lieu : ${booking.pickupLocation || 'Aéroport Tunis-Carthage'}`, 110, 80);

    // Financial Breakdown
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 88, 190, 88);

    doc.setFontSize(13);
    doc.text('DÉTAIL TARIFAIRE (DINARS TUNISIENS - TND)', 20, 98);
    doc.setFontSize(10);
    doc.text(`Durée de location : ${booking.durationDays} jour(s)`, 20, 106);
    doc.text(`Tarif journalier de base : ${booking.dailyRate} DT/jour`, 20, 112);
    doc.text(`Sous-total location : ${booking.rentalSubtotal} DT`, 20, 118);
    doc.text(`Options & Équipements : ${booking.extrasTotal} DT`, 20, 124);
    doc.text(`TVA (7%) : ${booking.tax} DT`, 20, 130);

    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text(`TOTAL FACTURÉ : ${booking.totalAmount} DT`, 20, 142);
    doc.text(`DÉPÔT DE GARANTIE : ${booking.depositAmount} DT`, 110, 142);

    // Terms
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Conditions générales : Le locataire certifie être en possession d\'un permis de conduire valide.', 20, 160);
    doc.text('Le véhicule doit être restitué avec le même niveau de carburant et dans un état propre.', 20, 166);
    doc.text('Tout retard non signalé fera l\'objet d\'une facturation supplémentaire selon les tarifs en vigueur.', 20, 172);

    // Signature stamp
    doc.rect(110, 185, 75, 40);
    doc.text('Signature du Locataire :', 114, 193);
    if (booking.agreementSigned) {
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(11);
      doc.text('✓ SIGNÉ NUMÉRIQUEMENT', 114, 205);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Horodatage : ${booking.signedAt || 'Certifié AUTORENT'}`, 114, 215);
    } else {
      doc.setTextColor(239, 68, 68);
      doc.text('En attente de signature', 114, 205);
    }

    doc.save(`Contrat_AUTORENT_${booking.bookingNumber}.pdf`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 pb-28 flex flex-col gap-6 select-none">
      {/* Top Banner with Brand */}
      <div className="bg-gradient-to-r from-[#0B251A] via-[#061710] to-[#04100B] p-6 rounded-3xl border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <AutoRentLogo variant="horizontal" size="md" />
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
              ESPACE CLIENT PRIVILÈGE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bienvenue, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">{currentUser?.name ? currentUser.name.split(' ')[0] : 'Client'}</span> 👋
          </h1>
          <p className="text-sm text-slate-300">
            Retrouvez tous vos contrats de location, justificatifs et paiements sécurisés.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveModal('CONTACT')}
            className="px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Phone className="w-4 h-4" />
            <span>Assistance 24/7</span>
          </button>
        </div>
      </div>

      {/* Primary Highlight: Next Rental Card */}
      {nextRental ? (
        <div className="bg-[#0F172E] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-wider border border-emerald-500/40">
                VOTRE PROCHAINE LOCATION
              </span>
              <span className="text-xs font-mono text-slate-400">#{nextRental.bookingNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={nextRental.status} size="sm" />
              {nextRental.agreementSigned ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Contrat signé
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Signature requise
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-44 relative">
              <img
                src={nextRental.vehicleImageUrl || nextVehicle?.images?.[0] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80'}
                alt={nextRental.vehicleName}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white font-mono font-bold text-xs border border-white/20">
                {nextRental.vehiclePlate}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-4">
              <div>
                <h3 className="text-2xl font-black text-white">{nextRental.vehicleName}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    {nextRental.startDate} → {nextRental.endDate} ({nextRental.durationDays} jours)
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Prise en charge : {nextRental.startTime || '10:00'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200 font-medium truncate">
                    {nextRental.pickupLocation || 'Aéroport International de Tunis-Carthage'}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-slate-400 text-[10px] block">Montant total</span>
                  <span className="text-lg font-black text-emerald-400">{nextRental.totalAmount} DT</span>
                </div>
              </div>

              {/* 5 Actions */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBooking(nextRental);
                    setActiveModal('DETAILS');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Détails réservation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBooking(nextRental);
                    setActiveModal('DOCS');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                  <span>Documents ({uploadedDocs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSign(nextRental)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    nextRental.agreementSigned
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-900'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{nextRental.agreementSigned ? 'Contrat signé ✓' : 'Signer le contrat'}</span>
                </button>

                {nextRental.paymentStatus !== 'PAID' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBooking(nextRental);
                      setActiveModal('PAY');
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Régler (En ligne)</span>
                  </button>
                ) : (
                  <span className="px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Payé ({nextRental.totalAmount} DT)</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(nextRental)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700 ml-auto"
                  title="Télécharger le contrat PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center gap-3">
          <Car className="w-12 h-12 text-slate-600" />
          <h3 className="text-lg font-bold text-white">Aucune réservation active</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Vous n'avez pas de réservation en cours. Réservez votre véhicule dès maintenant au meilleur tarif chez AUTORENT.
          </p>
        </div>
      )}

      {/* History of customer bookings (isolated) */}
      <div className="flex flex-col gap-3 mt-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Historique de vos locations</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {myBookings.length}
          </span>
        </h3>

        {myBookings.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Aucun historique disponible.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                    <img src={b.vehicleImageUrl} alt={b.vehicleName} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{b.vehicleName}</h4>
                    <p className="text-[11px] text-slate-400">{b.startDate} → {b.endDate}</p>
                    <span className="text-[10px] font-mono text-emerald-400">{b.totalAmount} DT · {b.bookingNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={b.status} size="sm" />
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(b)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Télécharger le contrat PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Digital Rental Agreement Signing (Section 24) */}
      {activeModal === 'SIGN' && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0F172E] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AutoRentLogo variant="icon" size="sm" />
                <div>
                  <h3 className="text-lg font-black text-white">Contrat de Location Numérique</h3>
                  <p className="text-xs text-slate-400 font-mono">Dossier #{selectedBooking.bookingNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-white text-sm">
                AUTORENT CAR TUNISIA — Conditions Générales de Location
              </p>
              <p>
                Le locataire, <strong>{selectedBooking.clientName}</strong>, déclare louer le véhicule{' '}
                <strong>{selectedBooking.vehicleName} ({selectedBooking.vehiclePlate})</strong> du{' '}
                <strong>{selectedBooking.startDate}</strong> au <strong>{selectedBooking.endDate}</strong>.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between">
                <span>Total convenu : <strong className="text-emerald-400">{selectedBooking.totalAmount} DT</strong></span>
                <span>Dépôt de garantie : <strong>{selectedBooking.depositAmount} DT</strong></span>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                En apposant votre signature ci-dessous, vous acceptez sans réserve les conditions générales de location et l'exactitude des informations fournies.
              </p>
            </div>

            {/* Signature Area */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                Signature du locataire (Tracez votre signature au doigt ou à la souris)
              </label>
              <SignaturePad
                onSave={(dataUrl) => setSignatureData(dataUrl)}
                initialDataUrl={signatureData || undefined}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveSignature}
                disabled={!signatureData || isSigning}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                {isSigning ? (
                  <span>Enregistrement...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmer et signer le contrat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Upload Documents */}
      {activeModal === 'DOCS' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F172E] border border-blue-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-400" />
                Justificatifs de location
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Afin de faciliter la remise des clés à l'aéroport, veuillez vérifier vos documents obligatoires :
            </p>

            <div className="flex flex-col gap-2">
              {['Permis de conduire (Recto / Verso)', 'Carte d\'identité nationale (CIN) ou Passeport', 'Justificatif de domicile'].map((doc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{doc}</span>
                  <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer transition-all">
                    Téléverser
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setUploadedDocs((prev) => [...prev, doc]);
                          alert(`Document ${doc} chargé avec succès !`);
                        }
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Online Payment Simulator */}
      {activeModal === 'PAY' && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172E] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CreditCard className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white">Règlement Sécurisé en Ligne</h3>
            <p className="text-xs text-slate-300">
              Paiement direct de votre contrat <strong>#{selectedBooking.bookingNumber}</strong>
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-sm font-bold text-white">
              <span>Montant à régler :</span>
              <span className="text-xl text-emerald-400">{selectedBooking.totalAmount} DT</span>
            </div>

            {paymentSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Paiement validé avec succès ! Reçu émis.
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleProcessPayment(selectedBooking)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirmer le paiement sécurisé ({selectedBooking.totalAmount} DT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Contact AUTORENT */}
      {activeModal === 'CONTACT' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172E] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                Assistance AUTORENT CAR TUNISIA
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold text-white">Service Client & Agence Tunis Carthage</div>
                  <div className="text-slate-400">+216 71 754 000 / +216 98 100 200 (24h/24)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-400" />
                <div>
                  <div className="font-bold text-white">Email & Réservations</div>
                  <div className="text-slate-400">contact@autorent.tn / carthage@autorent.tn</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-bold text-white">Comptoir Aéroport</div>
                  <div className="text-slate-400">Hall Arrivées, Terminal 1, Aéroport Tunis-Carthage</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal('NONE')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
