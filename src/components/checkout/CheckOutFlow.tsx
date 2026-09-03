import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useCheckIn } from '../../hooks/useCheckIn';
import { DamageItem, MandatoryPhotos } from '../../types';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Fuel,
  Gauge,
  RotateCcw,
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { TactileInput } from '../ui/TactileInput';
import { DamageVehicleDiagram } from '../ui/DamageVehicleDiagram';
import { FuelGaugeSlider } from '../ui/FuelGaugeSlider';
import { SignaturePad } from '../ui/SignaturePad';
import { CameraCaptureModal } from '../ui/CameraCaptureModal';
import confetti from 'canvas-confetti';

interface CheckOutFlowProps {
  onCancel: () => void;
  onSuccess: (bookingId: string) => void;
}

export const CheckOutFlow: React.FC<CheckOutFlowProps> = ({ onCancel, onSuccess }) => {
  const { selectedBookingForCheckOut, setSelectedBookingForCheckOut, bookings, vehicles } = useApp();
  const { calculateCheckOutSurcharges, completeCheckOut } = useCheckIn();

  const activeBooking =
    selectedBookingForCheckOut ||
    bookings.find(b => b.status === 'IN_PROGRESS');

  const activeVehicle = activeBooking
    ? vehicles.find(v => v.id === activeBooking.vehicleId) || vehicles[0]
    : undefined;

  // Return inspection parameters
  const [returnMileage, setReturnMileage] = useState<number>(activeVehicle ? activeVehicle.mileage + 820 : 0); // Simulating 820 km driven
  const [returnFuelLevel, setReturnFuelLevel] = useState<number>(75); // Simulating 75% return (missing 25%)
  const [newDamages, setNewDamages] = useState<DamageItem[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [returnPhotos, setReturnPhotos] = useState<MandatoryPhotos>({
    front: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
    rear: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800',
    left: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    right: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
    interior: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
    dashboard: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800',
  });

  // Step 1: KM & Fuel calculation & comparative check
  // Step 2: New Damages inspection & 6 return photos
  // Step 3: Surcharges recap, Deposit refund & Discharge signature
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Auto calculate comparison
  const surchargeCalc = calculateCheckOutSurcharges(
    activeBooking || ({} as any),
    activeVehicle || ({} as any),
    returnMileage,
    returnFuelLevel,
    newDamages
  );

  const handleFinalSubmit = () => {
    if (!signatureDataUrl || !activeBooking || !activeVehicle) return;

    setIsFinalizing(true);
    setTimeout(() => {
      completeCheckOut({
        bookingId: activeBooking.id,
        bookingNumber: activeBooking.bookingNumber,
        vehicleId: activeVehicle.id,
        agentId: 'u-1',
        agentName: 'Karim Benali',
        mileage: returnMileage,
        startMileage: activeVehicle.mileage,
        extraKm: surchargeCalc.extraKm,
        extraKmCost: surchargeCalc.extraKmCost,
        fuelLevel: returnFuelLevel,
        startFuelLevel: 100,
        missingFuelPercentage: surchargeCalc.missingFuelPercent,
        missingFuelCost: surchargeCalc.missingFuelCost,
        photos: returnPhotos,
        newDamages,
        damageCost: surchargeCalc.damageCost,
        totalSurcharges: surchargeCalc.totalSurcharges,
        depositRefundAmount: surchargeCalc.depositRefundAmount,
        signatureDataUrl,
        dischargeAgreed: true,
      });

      setSelectedBookingForCheckOut(null);
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
        <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black text-white">Aucun retour en attente</h2>
          <p className="text-sm text-slate-400 max-w-sm">
            Aucun véhicule loué n'est actuellement en cours de location ou en attente de restitution.
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
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            Check-Out Retour • Étape {currentStep}/3
          </span>
          <h1 className="text-base font-extrabold text-white">
            {currentStep === 1 && '1. Kilométrage & Carburant'}
            {currentStep === 2 && '2. Nouvelles Dégradations & Photos'}
            {currentStep === 3 && '3. Solde Caution & Décharge'}
          </h1>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
          <RotateCcw className="w-5 h-5" />
        </div>
      </div>

      {/* Progress Bars */}
      <div className="w-full bg-[#10172A] rounded-full h-2 overflow-hidden flex border border-slate-800">
        {[1, 2, 3].map(stepIdx => (
          <div
            key={stepIdx}
            className={`h-full flex-1 border-r border-slate-900 transition-all duration-300 ${
              currentStep >= stepIdx ? 'bg-blue-500' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Vehicle Info Badge */}
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
        <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/30">
          Caution {activeBooking.depositAmount} DT
        </span>
      </div>

      {/* STEP 1: MILEAGE COMPARISON & FUEL LEVEL */}
      {currentStep === 1 && (
        <div className="flex flex-col gap-4">
          {/* Mileage Comparison Card */}
          <div className="bg-[#10172A] rounded-3xl p-5 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase">
                    Comparatif Kilométrage
                  </span>
                  <h4 className="text-base font-extrabold text-white">Calcul Automatique Forfait</h4>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-[#0A0E1A] p-3 rounded-2xl border border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">KM Départ</span>
                <p className="font-mono font-bold text-white text-sm">
                  {activeVehicle.mileage.toLocaleString()} km
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Forfait Inclus</span>
                <p className="font-mono font-bold text-slate-300 text-sm">
                  {activeBooking.includedKm} km
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Parcourus</span>
                <p className="font-mono font-extrabold text-cyan-400 text-sm">
                  {surchargeCalc.drivenKm} km
                </p>
              </div>
            </div>

            <TactileInput
              label="Relevé Kilométrage Retour (au tableau de bord)"
              numericMode
              value={returnMileage.toString()}
              onChange={e => setReturnMileage(Number(e.target.value) || 0)}
              suffix="KM"
            />

            {/* Surcharge alert if extra km */}
            {surchargeCalc.extraKm > 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs font-bold text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Dépassement : +{surchargeCalc.extraKm} km ({activeVehicle.excessKmRate} DT/km)</span>
                </div>
                <span className="font-mono text-sm font-black">+{surchargeCalc.extraKmCost.toFixed(2)} DT</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Kilométrage dans la limite du forfait inclus</span>
              </div>
            )}
          </div>

          {/* Fuel Level Inspection */}
          <FuelGaugeSlider
            value={returnFuelLevel}
            onChange={setReturnFuelLevel}
            fuelType={activeVehicle.fuelType}
            tankCapacity={activeVehicle.fuelTankCapacity}
          />

          {surchargeCalc.missingFuelPercent > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between text-xs font-bold text-rose-300">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 flex-shrink-0" />
                <span>
                  Carburant manquant : -{surchargeCalc.missingFuelPercent}% (~{surchargeCalc.missingLiters.toFixed(1)}L @ {activeVehicle.fuelMissingRatePerLiter} DT/L)
                </span>
              </div>
              <span className="font-mono text-sm font-black">
                +{surchargeCalc.missingFuelCost.toFixed(2)} DT
              </span>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: NEW DAMAGES & RETURN PHOTOS */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-4">
          <DamageVehicleDiagram
            damages={[...activeVehicle.damages, ...newDamages]}
            onAddDamage={dmg =>
              setNewDamages(prev => [
                ...prev,
                { ...dmg, id: `dmg-new-${Date.now()}`, addedAt: '2026-09-02', addedByCheckType: 'CHECK_OUT' },
              ])
            }
            onRemoveDamage={dmgId => setNewDamages(prev => prev.filter(d => d.id !== dmgId))}
          />

          {/* Return Photos Button */}
          <div className="bg-[#10172A] rounded-3xl p-5 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase">
                6 Photos de Clôture
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                {Object.values(returnPhotos).filter(Boolean).length}/6 Photos enregistrées
              </p>
            </div>

            <TactileButton
              variant="outline"
              size="normal"
              icon={Camera}
              onClick={() => setShowCameraModal(true)}
            >
              Vérifier Photos
            </TactileButton>
          </div>
        </div>
      )}

      {/* STEP 3: FINANCIAL RECAP, DEPOSIT REFUND & DISCHARGE SIGNATURE */}
      {currentStep === 3 && (
        <div className="flex flex-col gap-4">
          {/* Financial Statement Box */}
          <div className="bg-[#10172A] rounded-3xl p-5 border border-slate-800 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h4 className="text-base font-extrabold text-white">Décompte Final & Caution</h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {activeBooking.bookingNumber}
              </span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Caution initiale déposée</span>
                <span className="font-mono font-bold">{activeBooking.depositAmount.toFixed(2)} DT</span>
              </div>

              {surchargeCalc.extraKmCost > 0 && (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Excédent KM ({surchargeCalc.extraKm} km x {activeVehicle.excessKmRate} DT)</span>
                  <span className="font-mono">- {surchargeCalc.extraKmCost.toFixed(2)} DT</span>
                </div>
              )}

              {surchargeCalc.missingFuelCost > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>Carburant non réapprovisionné ({surchargeCalc.missingLiters.toFixed(1)}L)</span>
                  <span className="font-mono">- {surchargeCalc.missingFuelCost.toFixed(2)} DT</span>
                </div>
              )}

              {surchargeCalc.damageCost > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>Frais réparations nouveaux dommages</span>
                  <span className="font-mono">- {surchargeCalc.damageCost.toFixed(2)} DT</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
                <span className="text-white">Montant Caution à Restituer</span>
                <span className="text-emerald-400 text-lg font-mono">
                  {surchargeCalc.depositRefundAmount.toFixed(2)} DT
                </span>
              </div>
            </div>
          </div>

          {/* Discharge Signature Canvas */}
          <SignaturePad
            clientName={activeBooking.clientName}
            type="CHECK_OUT"
            onConfirmSignature={sig => setSignatureDataUrl(sig)}
          />

          {signatureDataUrl && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Signature de décharge validée par le client.</span>
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

        {currentStep < 3 ? (
          <TactileButton
            variant="primary"
            className="flex-1 font-black"
            icon={ChevronRight}
            iconPosition="right"
            onClick={() => setCurrentStep(prev => (prev + 1) as any)}
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
            Clôturer Check-Out & Restituer Caution
          </TactileButton>
        )}
      </div>

      {showCameraModal && (
        <CameraCaptureModal
          photos={returnPhotos}
          title="6 Photos de Retour Véhicule"
          onSavePhotos={photos => setReturnPhotos(photos)}
          onClose={() => setShowCameraModal(false)}
        />
      )}
    </div>
  );
};
