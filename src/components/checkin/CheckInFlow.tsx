import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useCheckIn } from '../../hooks/useCheckIn';
import { Booking, Vehicle } from '../../types';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileCheck,
  Fuel,
  Gauge,
  Key,
  PenTool,
  QrCode,
  Scan,
  ShieldCheck,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { TactileInput } from '../ui/TactileInput';
import { DamageVehicleDiagram } from '../ui/DamageVehicleDiagram';
import { FuelGaugeSlider } from '../ui/FuelGaugeSlider';
import { SignaturePad } from '../ui/SignaturePad';
import { CameraCaptureModal } from '../ui/CameraCaptureModal';
import { LicenseScannerModal } from '../ui/LicenseScannerModal';
import confetti from 'canvas-confetti';

interface CheckInFlowProps {
  onCancel: () => void;
  onSuccess: (bookingId: string) => void;
}

export const CheckInFlow: React.FC<CheckInFlowProps> = ({ onCancel, onSuccess }) => {
  const { selectedBookingForCheckIn, bookings, vehicles, setSelectedBookingForCheckIn } = useApp();
  const {
    mandatoryPhotos,
    setMandatoryPhotos,
    damages,
    setDamages,
    mileage,
    setMileage,
    fuelLevel,
    setFuelLevel,
    licensePhotoUrl,
    setLicensePhotoUrl,
    ocrResult,
    setOcrResult,
    signatureDataUrl,
    setSignatureDataUrl,
    depositAmount,
    setDepositAmount,
    depositMethod,
    setDepositMethod,
    initForBooking,
    performCheckIn,
  } = useCheckIn();

  // If no booking was preselected, pick the first confirmed booking
  const activeBooking =
    selectedBookingForCheckIn ||
    bookings.find(b => b.status === 'CONFIRMED');

  const activeVehicle = activeBooking
    ? vehicles.find(v => v.id === activeBooking.vehicleId) || vehicles[0]
    : undefined;

  // 5 Step flow:
  // Step 1: Booking & License OCR verification
  // Step 2: 6 Mandatory Photos
  // Step 3: Mileage & Fuel gauge
  // Step 4: Damage vehicle diagram
  // Step 5: Deposit & Client signature
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Sub modals
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showLicenseScanner, setShowLicenseScanner] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (activeBooking && activeVehicle) {
      initForBooking(activeBooking, activeVehicle);
    }
  }, [activeBooking?.id, activeVehicle?.id]);

  const isPhotosDone = Object.values(mandatoryPhotos).every(Boolean);

  const handleFinalSubmit = () => {
    if (!signatureDataUrl || !activeBooking || !activeVehicle) return;

    setIsFinalizing(true);
    setTimeout(() => {
      const checkInResult = performCheckIn(activeBooking, activeVehicle);
      setSelectedBookingForCheckIn(null);
      setIsFinalizing(false);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      onSuccess(activeBooking.id);
    }, 900);
  };

  if (!activeBooking || !activeVehicle) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 flex flex-col items-center justify-center text-center gap-5 select-none">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black text-white">Aucun départ en attente</h2>
          <p className="text-sm text-slate-400 max-w-sm">
            Toutes les réservations confirmées ont déjà été remises à leurs locataires, ou aucune réservation n'est en attente de départ.
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            Retour au Tableau de Bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 pb-32 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="w-11 h-11 rounded-2xl bg-[#1A2338] border border-slate-700 text-slate-300 flex items-center justify-center active:scale-90"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            Check-In Départ • Étape {currentStep}/5
          </span>
          <h1 className="text-base font-extrabold text-white">
            {currentStep === 1 && '1. Identification & Permis'}
            {currentStep === 2 && '2. 6 Photos Obligatoires'}
            {currentStep === 3 && '3. Compteur KM & Carburant'}
            {currentStep === 4 && '4. Schéma des Dommages'}
            {currentStep === 5 && '5. Caution & Signature'}
          </h1>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
          <Key className="w-5 h-5" />
        </div>
      </div>

      {/* Progress Bars */}
      <div className="w-full bg-[#10172A] rounded-full h-2 overflow-hidden flex border border-slate-800">
        {[1, 2, 3, 4, 5].map(stepIdx => (
          <div
            key={stepIdx}
            className={`h-full flex-1 border-r border-slate-900 transition-all duration-300 ${
              currentStep >= stepIdx ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Vehicle & Client Quick Info Banner */}
      <div className="bg-[#10172A] rounded-3xl p-4 border border-slate-800 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={activeVehicle.images[0]}
            alt={activeVehicle.model}
            className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-cyan-400 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {activeVehicle.plate}
              </span>
              <span className="text-xs font-bold text-white">
                {activeVehicle.brand} {activeVehicle.model}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Locataire : <strong className="text-white">{activeBooking.clientName}</strong>
            </p>
          </div>
        </div>
        <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
          {activeBooking.bookingNumber}
        </span>
      </div>

      {/* STEP 1: IDENTIFICATION & DRIVING LICENSE OCR */}
      {currentStep === 1 && (
        <div className="bg-[#10172A] rounded-3xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase">
                Contrôle d’Identité & Permis
              </span>
              <h3 className="text-base font-extrabold text-white">
                Vérification du Titulaire
              </h3>
            </div>
            <Scan className="w-6 h-6 text-cyan-400" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 bg-[#0A0E1A] p-3 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Conducteur</span>
                <p className="font-extrabold text-white">{activeBooking.clientName}</p>
                <p className="text-slate-400">{activeBooking.clientPhone}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Permis de conduire</span>
                <p className="font-mono font-bold text-cyan-400">
                  {ocrResult?.number || 'Non scanné'}
                </p>
                {ocrResult && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Validé OCR ({Math.round(ocrResult.confidence * 100)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Expiring license alert check */}
            {ocrResult?.expiryDate.startsWith('2026') && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Attention : Le permis de ce client expire ce mois-ci !</span>
              </div>
            )}

            {/* Big License Scanner Trigger Button */}
            <TactileButton
              variant={ocrResult ? 'outline' : 'primary'}
              icon={Scan}
              size="normal"
              onClick={() => setShowLicenseScanner(true)}
            >
              {ocrResult ? 'Re-scanner le Permis (OCR)' : 'Scanner le Permis de Conduire (Caméra)'}
            </TactileButton>
          </div>
        </div>
      )}

      {/* STEP 2: 6 MANDATORY PHOTOS CHECKLIST */}
      {currentStep === 2 && (
        <div className="bg-[#10172A] rounded-3xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase">
                Contrôle Visuel Extérieur & Intérieur
              </span>
              <h3 className="text-base font-extrabold text-white">
                6 Photos Obligatoires
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">
              {Object.values(mandatoryPhotos).filter(Boolean).length}/6 Photos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { key: 'front', label: '1. Face Avant', url: mandatoryPhotos.front },
              { key: 'rear', label: '2. Face Arrière', url: mandatoryPhotos.rear },
              { key: 'left', label: '3. Profil Gauche', url: mandatoryPhotos.left },
              { key: 'right', label: '4. Profil Droit', url: mandatoryPhotos.right },
              { key: 'interior', label: '5. Intérieur', url: mandatoryPhotos.interior },
              { key: 'dashboard', label: '6. Compteur/Jauge', url: mandatoryPhotos.dashboard },
            ].map(item => (
              <div
                key={item.key}
                onClick={() => setShowCameraModal(true)}
                className={`min-h-[110px] rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all active:scale-95 ${
                  item.url
                    ? 'border-emerald-500/80 bg-[#131E38] relative overflow-hidden'
                    : 'border-dashed border-slate-700 bg-[#0A0E1A] hover:border-slate-500'
                }`}
              >
                {item.url ? (
                  <>
                    <img src={item.url} alt={item.label} className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-emerald-400 font-bold text-xs gap-1">
                      <Check className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-slate-500 mb-1" />
                    <span className="text-xs font-bold text-slate-300">{item.label}</span>
                    <span className="text-[10px] text-slate-500">Touchez pour capturer</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Shutter Camera Launch Button (Min 56px height) */}
          <TactileButton
            variant="primary"
            icon={Camera}
            onClick={() => setShowCameraModal(true)}
          >
            {isPhotosDone ? 'Revoir / Modifier les Photos' : 'Ouvrir la Caméra d’Inspection (72×72px)'}
          </TactileButton>
        </div>
      )}

      {/* STEP 3: MILEAGE & FUEL GAUGE */}
      {currentStep === 3 && (
        <div className="flex flex-col gap-4">
          {/* Mileage Input */}
          <div className="bg-[#10172A] rounded-3xl p-5 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Compteur Kilométrique
                  </span>
                  <h4 className="text-base font-extrabold text-white">Relevé Kilométrage Départ</h4>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                Précédent : {activeVehicle.mileage.toLocaleString()} km
              </span>
            </div>

            <TactileInput
              label="Kilométrage actuel (au tableau de bord)"
              numericMode
              value={mileage.toString()}
              onChange={e => setMileage(Number(e.target.value) || 0)}
              suffix="KM"
            />
          </div>

          {/* Fuel Level Slider */}
          <FuelGaugeSlider
            value={fuelLevel}
            onChange={setFuelLevel}
            fuelType={activeVehicle.fuelType}
            tankCapacity={activeVehicle.fuelTankCapacity}
          />
        </div>
      )}

      {/* STEP 4: INTERACTIVE DAMAGE VEHICLE DIAGRAM */}
      {currentStep === 4 && (
        <DamageVehicleDiagram
          damages={damages}
          onAddDamage={dmg => setDamages(prev => [...prev, { ...dmg, id: `dmg-${Date.now()}`, addedAt: '2026-09-02' }])}
          onRemoveDamage={dmgId => setDamages(prev => prev.filter(d => d.id !== dmgId))}
        />
      )}

      {/* STEP 5: DEPOSIT COLLECTION & SIGNATURE */}
      {currentStep === 5 && (
        <div className="flex flex-col gap-4">
          {/* Deposit Collection Box */}
          <div className="bg-[#10172A] rounded-3xl p-5 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase">
                    Dépôt de Garantie (Caution)
                  </span>
                  <h4 className="text-base font-extrabold text-white">Encaissement / Pré-autorisation</h4>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-white">{depositAmount} DT</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TactileInput
                label="Montant Caution (DT)"
                numericMode
                value={depositAmount.toString()}
                onChange={e => setDepositAmount(Number(e.target.value) || 0)}
                suffix="DT"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-300">Moyen de caution</label>
                <div className="grid grid-cols-2 gap-1 min-h-[56px]">
                  <button
                    type="button"
                    onClick={() => setDepositMethod('STRIPE_CARD')}
                    className={`rounded-2xl border text-xs font-bold transition-all ${
                      depositMethod === 'STRIPE_CARD'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-[#131B2E] border-slate-800 text-slate-400'
                    }`}
                  >
                    Empreinte CB
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMethod('CASH')}
                    className={`rounded-2xl border text-xs font-bold transition-all ${
                      depositMethod === 'CASH'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-[#131B2E] border-slate-800 text-slate-400'
                    }`}
                  >
                    Espèces
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Canvas */}
          <SignaturePad
            clientName={activeBooking.clientName}
            type="CHECK_IN"
            onConfirmSignature={sig => setSignatureDataUrl(sig)}
          />

          {signatureDataUrl && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Signature du client enregistrée avec succès !</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Step Navigation Bar */}
      <div className="flex items-center gap-3 pt-2">
        {currentStep > 1 && (
          <TactileButton
            variant="outline"
            className="flex-1"
            onClick={() => setCurrentStep(prev => (prev - 1) as any)}
          >
            Précédent
          </TactileButton>
        )}

        {currentStep < 5 ? (
          <TactileButton
            variant="primary"
            className="flex-1 font-black"
            icon={ChevronRight}
            iconPosition="right"
            onClick={() => {
              // If moving from step 2 and photos not set, we can auto-preset or encourage capture
              if (currentStep === 2 && !isPhotosDone) {
                setMandatoryPhotos({
                  front: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
                  rear: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800',
                  left: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
                  right: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
                  interior: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
                  dashboard: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800',
                });
              }
              setCurrentStep(prev => (prev + 1) as any);
            }}
          >
            Continuer
          </TactileButton>
        ) : (
          <TactileButton
            variant="success"
            className="flex-1 font-black"
            loading={isFinalizing}
            disabled={!signatureDataUrl}
            icon={CheckCircle2}
            onClick={handleFinalSubmit}
          >
            Valider Check-In & Remettre Clés
          </TactileButton>
        )}
      </div>

      {/* Sub-Modals for Camera & License Scanner */}
      {showCameraModal && (
        <CameraCaptureModal
          photos={mandatoryPhotos}
          onSavePhotos={photos => setMandatoryPhotos(photos)}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {showLicenseScanner && (
        <LicenseScannerModal
          expectedClientName={activeBooking.clientName}
          onScanComplete={(ocr, photo) => {
            setOcrResult(ocr);
            setLicensePhotoUrl(photo);
          }}
          onClose={() => setShowLicenseScanner(false)}
        />
      )}
    </div>
  );
};
