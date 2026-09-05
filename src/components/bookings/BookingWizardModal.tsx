import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useBooking } from '../../hooks/useBooking';
import { Client, PaymentMethod, Vehicle } from '../../types';
import {
  Calendar,
  Car,
  Check,
  ChevronRight,
  CreditCard,
  Banknote,
  Building,
  Plus,
  Search,
  User,
  X,
  Sparkles,
  ShieldCheck,
  FileText,
  UserPlus,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { TactileInput } from '../ui/TactileInput';
import { StatusBadge } from '../ui/StatusBadge';
import confetti from 'canvas-confetti';

interface BookingWizardModalProps {
  onClose: () => void;
  preSelectedVehicleId?: string;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  onClose,
  preSelectedVehicleId,
}) => {
  const { clients, vehicles, extras, currentAgency, addBooking, addClient } = useApp();
  const { calculateBookingPricing, isVehicleAvailable, getVehicleConflictInfo } = useBooking();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Client State
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [clientSearch, setClientSearch] = useState('');
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLicenseNumber, setNewLicenseNumber] = useState('');

  // Step 2: Vehicle, Dates & Extras State
  const initialVehicle =
    vehicles.find(v => v.id === preSelectedVehicleId) ||
    vehicles.find(v => v.status === 'AVAILABLE') ||
    vehicles[0];
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(initialVehicle);
  const [startDate, setStartDate] = useState('2026-09-02');
  const [endDate, setEndDate] = useState('2026-09-05');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedExtras, setSelectedExtras] = useState<string[]>(['ext-all-inclusive']);
  const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState<string>('ALL');
  const [showConflictingVehicles, setShowConflictingVehicles] = useState(false);

  // Step 3: Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STRIPE_CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate rental duration in days
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const diffTime = Math.max(1, endD.getTime() - startD.getTime());
  const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const pricing = calculateBookingPricing(selectedVehicle, durationDays, selectedExtras);

  const filteredClients = clients.filter(
    c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch) ||
      c.licenseNumber.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const availableVehiclesList = vehicles.filter(v => {
    if (vehicleCategoryFilter !== 'ALL' && v.category !== vehicleCategoryFilter) return false;
    return isVehicleAvailable(v.id, startDate, endDate);
  });

  const conflictingVehiclesList = vehicles.filter(v => {
    if (vehicleCategoryFilter !== 'ALL' && v.category !== vehicleCategoryFilter) return false;
    return !isVehicleAvailable(v.id, startDate, endDate);
  });

  const currentVehicleConflict = selectedVehicle
    ? getVehicleConflictInfo(selectedVehicle.id, startDate, endDate)
    : { hasConflict: false, reason: '' };

  const handleCreateClientQuick = () => {
    if (!newFirstName || !newLastName || !newPhone) return;

    const created = addClient({
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail || `${newFirstName.toLowerCase()}.${newLastName.toLowerCase()}@gmail.com`,
      phone: newPhone,
      licenseNumber: newLicenseNumber || '26FR991823',
      licenseIssueDate: '2020-01-15',
      licenseExpiryDate: '2035-01-15',
      birthDate: '1995-06-12',
      address: '22 Avenue des Champs-Élysées',
      city: 'Paris 75008',
    });

    setSelectedClient(created);
    setIsCreatingNewClient(false);
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev =>
      prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
    );
  };

  const handleFinalizeBooking = () => {
    if (!selectedClient) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const createdBooking = addBooking({
        clientId: selectedClient.id,
        clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        clientPhone: selectedClient.phone,
        clientEmail: selectedClient.email,
        vehicleId: selectedVehicle.id,
        vehicleName: `${selectedVehicle.brand} ${selectedVehicle.model}`,
        vehiclePlate: selectedVehicle.plate,
        vehicleImageUrl: selectedVehicle.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        agencyId: currentAgency.id,
        startDate,
        endDate,
        startTime,
        endTime,
        dailyRate: pricing.dailyRate,
        durationDays,
        includedKm: durationDays * 250,
        selectedExtras,
        extrasTotal: pricing.extrasTotal,
        rentalSubtotal: pricing.rentalSubtotal,
        tax: pricing.tax,
        totalAmount: pricing.totalAmount,
        depositAmount: pricing.depositAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
        status: 'CONFIRMED',
        notes: bookingNotes,
      });

      setIsSubmitting(false);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header with Wizard Step Indicator */}
        <div className="pt-safe px-5 py-4 bg-[#131E38] border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
              Nouvelle Réservation • Étape {step}/3
            </span>
            <h2 className="text-lg font-extrabold text-white">
              {step === 1 && '1. Choix ou Création du Client'}
              {step === 2 && '2. Véhicule, Calendrier & Extras'}
              {step === 3 && '3. Paiement & Facture Sécurisée'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-[#0A0E1A] h-1.5 flex">
          <div
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Wizard Step Content Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* STEP 1: CLIENT SELECTION OR CREATION */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rechercher un client existant
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isCreatingNewClient ? 'Choisir existant' : '+ Création rapide'}</span>
                </button>
              </div>

              {isCreatingNewClient ? (
                /* Quick Client Creation Form */
                <div className="bg-[#131B2E] p-4 rounded-2xl border border-indigo-500/40 flex flex-col gap-3">
                  <span className="text-xs font-extrabold text-indigo-300 uppercase">
                    Fiche Nouveau Client
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <TactileInput
                      label="Prénom"
                      value={newFirstName}
                      onChange={e => setNewFirstName(e.target.value)}
                      placeholder="Ex: Jean"
                    />
                    <TactileInput
                      label="Nom"
                      value={newLastName}
                      onChange={e => setNewLastName(e.target.value)}
                      placeholder="Ex: Dupont"
                    />
                  </div>
                  <TactileInput
                    label="Téléphone mobile"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                  <TactileInput
                    label="Email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="jean.dupont@email.com"
                  />
                  <TactileInput
                    label="Numéro de permis"
                    value={newLicenseNumber}
                    onChange={e => setNewLicenseNumber(e.target.value)}
                    placeholder="Ex: 26FR991823"
                  />

                  <TactileButton
                    variant="primary"
                    icon={Check}
                    disabled={!newFirstName || !newLastName || !newPhone}
                    onClick={handleCreateClientQuick}
                  >
                    Valider le Client
                  </TactileButton>
                </div>
              ) : (
                /* Search & Client Cards List */
                <div className="flex flex-col gap-3">
                  <TactileInput
                    icon={Search}
                    placeholder="Nom, prénom, téléphone ou permis..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    clearable
                    onClear={() => setClientSearch('')}
                  />

                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {filteredClients.map(client => {
                      const isSelected = selectedClient?.id === client.id;
                      return (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all active:scale-98 ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                              : 'bg-[#131B2E] border-slate-800 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/30">
                              {client.firstName[0]}
                              {client.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-white">
                                {client.firstName} {client.lastName}
                              </p>
                              <p className="text-xs text-slate-400">
                                {client.phone} • Permis : <span className="font-mono text-cyan-400">{client.licenseNumber}</span>
                              </p>
                            </div>
                          </div>

                          {isSelected && <Check className="w-5 h-5 text-indigo-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: VEHICLE & DATES & EXTRAS */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Date & Time Picker */}
              <div className="bg-[#131B2E] p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Période de Location ({durationDays} jour{durationDays > 1 ? 's' : ''})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <TactileInput
                    label="Date Départ"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                  <TactileInput
                    label="Date Retour"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TactileInput
                    label="Heure Départ"
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                  <TactileInput
                    label="Heure Retour"
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Conflict warning banner if selected vehicle is not available */}
              {currentVehicleConflict.hasConflict && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-white text-xs">
                      Conflit de réservation pour {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.plate})
                    </span>
                    <p className="text-rose-200">
                      {currentVehicleConflict.reason}. Veuillez sélectionner un véhicule disponible dans la liste ci-dessous pour continuer.
                    </p>
                  </div>
                </div>
              )}

              {/* Vehicle Selection with Availability Filter */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Véhicules disponibles ({availableVehiclesList.length})
                  </span>
                  <select
                    value={vehicleCategoryFilter}
                    onChange={e => setVehicleCategoryFilter(e.target.value)}
                    className="bg-[#131B2E] border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="ALL">Toutes catégories</option>
                    <option value="CITADINE">Citadine</option>
                    <option value="SUV">SUV</option>
                    <option value="COMPACTE">Compacte</option>
                    <option value="ELECTRIQUE">Électrique</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="UTILITAIRE">Utilitaire</option>
                  </select>
                </div>

                {availableVehiclesList.length === 0 ? (
                  <div className="p-6 text-center bg-[#0A0E1A] rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
                    <Car className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-white">Aucun véhicule disponible sur ces dates / cette catégorie</p>
                    <p className="mt-1 text-[11px] text-slate-400">Modifiez les dates ou le filtre de catégorie pour voir les disponibilités.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {availableVehiclesList.map(veh => {
                      const isSelected = selectedVehicle.id === veh.id;
                      return (
                        <div
                          key={veh.id}
                          onClick={() => setSelectedVehicle(veh)}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between gap-2 transition-all active:scale-98 ${
                            isSelected
                              ? 'bg-indigo-950/50 border-indigo-500 shadow-md'
                              : 'bg-[#131B2E] border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={veh.images[0]}
                              alt={veh.model}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                            />
                            <div>
                              <p className="text-xs font-extrabold text-white">
                                {veh.brand} {veh.model}
                              </p>
                              <span className="font-mono text-[11px] text-cyan-400 font-bold">
                                {veh.plate}
                              </span>
                              <p className="text-xs font-black text-emerald-400 mt-0.5">
                                {veh.dailyRate.toFixed(2)} DT / jour
                              </p>
                            </div>
                          </div>

                          {isSelected && <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Conflicting / Unavailable Vehicles Toggle */}
                {conflictingVehiclesList.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setShowConflictingVehicles(!showConflictingVehicles)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      <span>{showConflictingVehicles ? 'Masquer' : 'Voir'} les véhicules indisponibles / en conflit ({conflictingVehiclesList.length})</span>
                    </button>

                    {showConflictingVehicles && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {conflictingVehiclesList.map(veh => {
                          const conflict = getVehicleConflictInfo(veh.id, startDate, endDate);
                          return (
                            <div
                              key={veh.id}
                              className="p-2.5 rounded-xl border border-slate-800/80 bg-[#0A0E1A]/80 flex items-center justify-between gap-2 opacity-75"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={veh.images[0]}
                                  alt={veh.model}
                                  className="w-10 h-10 rounded-lg object-cover grayscale"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-300 truncate">
                                    {veh.brand} {veh.model}
                                  </p>
                                  <p className="text-[10px] text-rose-400 font-medium truncate">
                                    {conflict.reason || 'Indisponible'}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge status={veh.status} size="small" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Extras Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Options & Assurances
                </span>
                <div className="flex flex-col gap-2">
                  {extras.map(extra => {
                    const isChecked = selectedExtras.includes(extra.id);
                    const totalForExtra = extra.pricePerDay * durationDays;

                    return (
                      <div
                        key={extra.id}
                        onClick={() => toggleExtra(extra.id)}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all active:scale-98 ${
                          isChecked
                            ? 'bg-indigo-950/40 border-indigo-500 text-white'
                            : 'bg-[#131B2E] border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-indigo-400" />
                            <span>{extra.name}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">{extra.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-indigo-400">
                            +{totalForExtra.toFixed(2)} DT
                          </span>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {extra.pricePerDay.toFixed(2)} DT/j
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT & CONFIRMATION */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              {/* Recapitulative Summary Box */}
              <div className="bg-[#131B2E] p-4 rounded-3xl border border-slate-800 flex flex-col gap-2.5">
                <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase">
                      Devis Facture
                    </span>
                    <h4 className="text-base font-extrabold text-white">
                      {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.plate})
                    </h4>
                    <p className="text-xs text-slate-400">
                      Client : {selectedClient?.firstName} {selectedClient?.lastName}
                    </p>
                  </div>
                  <span className="text-xl font-black font-mono text-emerald-400">
                    {pricing.totalAmount.toFixed(2)} DT
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Location ({durationDays} jours x {pricing.dailyRate.toFixed(2)} DT)</span>
                    <span className="font-mono">{pricing.rentalSubtotal.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Options & Assurances ({selectedExtras.length})</span>
                    <span className="font-mono">{pricing.extrasTotal.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA (20%)</span>
                    <span className="font-mono">{pricing.tax.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-300 pt-1 border-t border-slate-800">
                    <span>Caution à bloquer (Dépôt de garantie)</span>
                    <span className="font-mono">{pricing.depositAmount.toFixed(2)} DT</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Mode de règlement
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'STRIPE_CARD', label: 'Carte Stripe', icon: CreditCard },
                    { id: 'CASH', label: 'Espèces (Comptoir)', icon: Banknote },
                    { id: 'TRANSFER', label: 'Virement', icon: Building },
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`min-h-[52px] p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                        paymentMethod === method.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-[#131B2E] border-slate-800 text-slate-400'
                      }`}
                    >
                      <method.icon className="w-5 h-5" />
                      <span className="text-[11px] font-bold">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* If Stripe Card: Card preview */}
              {paymentMethod === 'STRIPE_CARD' && (
                <div className="bg-[#131B2E] p-4 rounded-2xl border border-slate-700 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>TPE Virtuel Stripe Sécurisé</span>
                    <span className="text-emerald-400">SSL 256-bit</span>
                  </div>
                  <TactileInput
                    label="Numéro de Carte Bancaire"
                    icon={CreditCard}
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <TactileInput
                      label="Expiration"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                    />
                    <TactileInput
                      label="CVC"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs">
                  ℹ️ Le statut de paiement sera marqué <strong>"En attente"</strong> jusqu'à l'encaissement physique des espèces au comptoir lors du check-in.
                </div>
              )}

              <TactileInput
                label="Notes de réservation (Optionnel)"
                placeholder="Ex: Vol AF1280, siège enfant déjà monté..."
                value={bookingNotes}
                onChange={e => setBookingNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Bottom Wizard Navigation Footer */}
        <div className="pb-safe px-5 py-4 bg-[#131E38] border-t border-slate-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <TactileButton
              variant="outline"
              className="flex-1"
              onClick={() => setStep(prev => (prev - 1) as any)}
            >
              Précédent
            </TactileButton>
          ) : (
            <TactileButton
              variant="ghost"
              className="flex-1 text-slate-400"
              onClick={onClose}
            >
              Annuler
            </TactileButton>
          )}

          {step < 3 ? (
            <TactileButton
              variant="primary"
              className="flex-1"
              icon={ChevronRight}
              iconPosition="right"
              disabled={
                (step === 1 && !selectedClient) ||
                (step === 2 && currentVehicleConflict.hasConflict)
              }
              onClick={() => setStep(prev => (prev + 1) as any)}
            >
              {step === 2 && currentVehicleConflict.hasConflict ? 'Véhicule en conflit' : 'Suivant'}
            </TactileButton>
          ) : (
            <TactileButton
              variant="success"
              className="flex-1 font-black"
              loading={isSubmitting}
              icon={Check}
              onClick={handleFinalizeBooking}
            >
              Confirmer & Facturer
            </TactileButton>
          )}
        </div>
      </div>
    </div>
  );
};
