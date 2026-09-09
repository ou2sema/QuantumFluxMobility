import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingFormSchema, BookingFormData } from '../../schemas';
import { useApp } from '../../context/AppContext';
import {
  X,
  Calendar,
  Shield,
  MapPin,
  DollarSign,
  Car,
  User,
  AlertCircle,
  UserPlus,
  Plus,
  CheckCircle2,
  Sparkles,
  Check,
} from 'lucide-react';
import { Vehicle, Client } from '../../types';
import { NewClientModal } from '../clients/NewClientModal';
import { useBooking } from '../../hooks/useBooking';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicleId?: string;
  preselectedStartDate?: string;
  preselectedClientId?: string;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicleId,
  preselectedStartDate,
  preselectedClientId,
}) => {
  const { vehicles, clients, addBooking, addClient, currentAgency } = useApp();
  const { isVehicleAvailable, getVehicleConflictInfo } = useBooking();

  // Rule: Only include cars with status 'AVAILABLE' (or if explicitly preselected)
  const baseAvailableVehicles = useMemo(() => {
    return vehicles.filter(
      (v) => v.status === 'AVAILABLE' || (preselectedVehicleId && v.id === preselectedVehicleId)
    );
  }, [vehicles, preselectedVehicleId]);

  const defaultStartDate = preselectedStartDate || new Date().toISOString().split('T')[0];
  const defaultEndDate = (() => {
    const d = new Date(defaultStartDate);
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  })();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      vehicleId: preselectedVehicleId || baseAvailableVehicles[0]?.id || '',
      clientId: preselectedClientId || clients[0]?.id || '',
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      startTime: '10:00',
      endTime: '10:00',
      pickupLocation: 'Aéroport Tunis-Carthage (TUN)',
      returnLocation: 'Aéroport Tunis-Carthage (TUN)',
      insuranceTier: 'STANDARD',
      dailyRate: baseAvailableVehicles[0]?.dailyRate || 65,
      depositAmount: 500,
      notes: '',
    },
  });

  // Client creation within reservation modal state
  const [showFullClientModal, setShowFullClientModal] = useState(false);
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [justAddedClient, setJustAddedClient] = useState<Client | null>(null);

  // Quick client inline inputs
  const [quickFirstName, setQuickFirstName] = useState('');
  const [quickLastName, setQuickLastName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickLicense, setQuickLicense] = useState('');
  const [quickError, setQuickError] = useState('');

  const watchedVehicleId = watch('vehicleId');
  const watchedClientId = watch('clientId');
  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');
  const watchedDailyRate = watch('dailyRate');

  // Filter available vehicles: status 'AVAILABLE' and no date conflicts to avoid booking collisions
  const availableVehicles = useMemo(() => {
    return baseAvailableVehicles.filter((v) => {
      // Must be AVAILABLE (or preselected)
      if (v.status !== 'AVAILABLE' && v.id !== preselectedVehicleId) {
        return false;
      }
      // Check date availability
      if (watchedStartDate && watchedEndDate) {
        return isVehicleAvailable(v.id, watchedStartDate, watchedEndDate);
      }
      return true;
    });
  }, [baseAvailableVehicles, preselectedVehicleId, watchedStartDate, watchedEndDate, isVehicleAvailable]);

  // Conflict detection for the actively selected vehicle
  const selectedVehicleConflict = useMemo(() => {
    if (!watchedVehicleId) return { hasConflict: false, reason: null };
    const veh = vehicles.find((v) => v.id === watchedVehicleId);
    if (!veh) return { hasConflict: true, reason: 'Véhicule introuvable' };
    if (veh.status !== 'AVAILABLE' && veh.id !== preselectedVehicleId) {
      return {
        hasConflict: true,
        reason: `Ce véhicule a le statut "${veh.status}" et n'est pas disponible pour une nouvelle réservation.`,
      };
    }
    if (watchedStartDate && watchedEndDate) {
      const conflict = getVehicleConflictInfo(veh.id, watchedStartDate, watchedEndDate);
      if (conflict.hasConflict) {
        return {
          hasConflict: true,
          reason: conflict.reason || 'Ce véhicule est indisponible sur cette période.',
        };
      }
    }
    return { hasConflict: false, reason: null };
  }, [watchedVehicleId, vehicles, preselectedVehicleId, watchedStartDate, watchedEndDate, getVehicleConflictInfo]);

  // Re-sync form values whenever modal opens or preselected props change
  React.useEffect(() => {
    if (isOpen) {
      const start = preselectedStartDate || new Date().toISOString().split('T')[0];
      const d = new Date(start);
      d.setDate(d.getDate() + 3);
      const end = d.toISOString().split('T')[0];

      // Find first vehicle with status AVAILABLE and no conflict
      const validVehicles = baseAvailableVehicles.filter((v) =>
        isVehicleAvailable(v.id, start, end)
      );

      const chosenVehicleId =
        preselectedVehicleId || validVehicles[0]?.id || baseAvailableVehicles[0]?.id || '';
      const chosenVehicle = vehicles.find((v) => v.id === chosenVehicleId);

      reset({
        vehicleId: chosenVehicleId,
        clientId: preselectedClientId || clients[0]?.id || '',
        startDate: start,
        endDate: end,
        startTime: '10:00',
        endTime: '10:00',
        pickupLocation: 'Aéroport Tunis-Carthage (TUN)',
        returnLocation: 'Aéroport Tunis-Carthage (TUN)',
        insuranceTier: 'STANDARD',
        dailyRate: chosenVehicle?.dailyRate || validVehicles[0]?.dailyRate || 65,
        depositAmount: 500,
        notes: '',
      });
      setShowQuickAddClient(false);
      setJustAddedClient(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    preselectedStartDate,
    preselectedVehicleId,
    preselectedClientId,
    reset,
  ]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === watchedClientId);
  }, [clients, watchedClientId]);

  const handleCreateClientQuick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!quickFirstName.trim() || !quickLastName.trim()) {
      setQuickError('Veuillez renseigner le prénom et le nom');
      return;
    }
    if (!quickPhone.trim()) {
      setQuickError('Veuillez renseigner un numéro de téléphone');
      return;
    }

    try {
      const created = addClient({
        firstName: quickFirstName.trim(),
        lastName: quickLastName.trim(),
        phone: quickPhone.trim(),
        email:
          quickEmail.trim().toLowerCase() ||
          `${quickFirstName.trim().toLowerCase()}.${quickLastName.trim().toLowerCase()}@email.com`,
        licenseNumber:
          quickLicense.trim().toUpperCase() ||
          `FR-${Math.floor(10000000 + Math.random() * 90000000)}`,
        licenseIssueDate: '2019-01-10',
        licenseExpiryDate: '2034-01-10',
        birthDate: '1993-04-12',
        address: 'Adresse non renseignée',
        city: 'Paris',
      });

      setValue('clientId', created.id, { shouldValidate: true });
      setJustAddedClient(created);
      setShowQuickAddClient(false);
      setQuickError('');
      setQuickFirstName('');
      setQuickLastName('');
      setQuickPhone('');
      setQuickEmail('');
      setQuickLicense('');
    } catch (err) {
      console.error('Erreur création client inline:', err);
    }
  };

  // Update daily rate if vehicle changes
  React.useEffect(() => {
    if (watchedVehicleId) {
      const v = vehicles.find((veh) => veh.id === watchedVehicleId);
      if (v) {
        setValue('dailyRate', v.dailyRate);
      }
    }
  }, [watchedVehicleId, vehicles, setValue]);

  // Compute duration and estimated total
  const durationDays = useMemo(() => {
    if (!watchedStartDate || !watchedEndDate) return 1;
    const start = new Date(watchedStartDate).getTime();
    const end = new Date(watchedEndDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [watchedStartDate, watchedEndDate]);

  const estimatedTotal = useMemo(() => {
    const subtotal = durationDays * (watchedDailyRate || 0);
    const tax = subtotal * 0.2;
    return subtotal + tax;
  }, [durationDays, watchedDailyRate]);

  if (!isOpen) return null;

  const onSubmit = (data: BookingFormData) => {
    const vehicle = vehicles.find((v) => v.id === data.vehicleId);
    const client = clients.find((c) => c.id === data.clientId);

    if (!vehicle || !client) return;

    if (selectedVehicleConflict.hasConflict) {
      alert(selectedVehicleConflict.reason || 'Ce véhicule est indisponible sur ces dates.');
      return;
    }

    const rentalSubtotal = durationDays * data.dailyRate;
    const tax = rentalSubtotal * 0.2;
    const totalAmount = rentalSubtotal + tax;

    addBooking({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      vehiclePlate: vehicle.plate,
      vehicleImageUrl: vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
      agencyId: currentAgency?.id || 'agency-paris-orly',
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      clientPhone: client.phone,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: '10:00',
      endTime: '18:00',
      durationDays,
      status: 'CONFIRMED',
      dailyRate: data.dailyRate,
      includedKm: 250,
      rentalSubtotal,
      selectedExtras: [],
      extrasTotal: 0,
      tax,
      totalAmount,
      depositAmount: data.depositAmount,
      paymentStatus: 'PENDING',
      paymentMethod: 'STRIPE_CARD',
      notes: [
        data.notes,
        `Assurance: ${data.insuranceTier}`,
        `Prise en charge: ${data.pickupLocation}`,
        `Restitution: ${data.returnLocation}`,
      ]
        .filter(Boolean)
        .join(' • '),
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    reset();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-form-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="booking-form-modal-title" className="text-base font-bold text-white">
                Nouvelle Réservation (Zod & Hook-Form)
              </h2>
              <p className="text-xs text-slate-400">
                Saisie validée avec calcul automatique du contrat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le formulaire"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Row 1: Vehicle & Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-vehicle" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-blue-400" />
                  Véhicule (Disponibles uniquement) *
                </span>
                <span className="text-[10px] text-emerald-400 font-medium font-mono">
                  {availableVehicles.length} disponible{availableVehicles.length > 1 ? 's' : ''}
                </span>
              </label>
              <select
                id="booking-vehicle"
                {...register('vehicleId')}
                aria-invalid={!!errors.vehicleId}
                aria-describedby={errors.vehicleId ? 'vehicleId-error' : undefined}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un véhicule disponible</option>
                {availableVehicles.length === 0 ? (
                  <option value="" disabled>
                    Aucun véhicule disponible avec le statut Disponible
                  </option>
                ) : (
                  availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.plate}) — {v.dailyRate} DT/j • Disponible
                    </option>
                  ))
                )}
              </select>
              {selectedVehicleConflict.hasConflict && (
                <div className="mt-1.5 p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{selectedVehicleConflict.reason}</span>
                </div>
              )}
              {errors.vehicleId && !selectedVehicleConflict.hasConflict && (
                <p id="vehicleId-error" className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.vehicleId.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label htmlFor="booking-client" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Client *
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddClient(!showQuickAddClient)}
                    className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                    title="Ajouter rapidement un client directement ici"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Création rapide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFullClientModal(true)}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition cursor-pointer"
                    title="Ouvrir le formulaire complet avec scanner de permis OCR"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Nouveau Client (OCR)</span>
                  </button>
                </div>
              </div>

              <select
                id="booking-client"
                {...register('clientId')}
                onChange={(e) => {
                  if (e.target.value === '__NEW_CLIENT_INLINE__') {
                    setShowQuickAddClient(true);
                    return;
                  }
                  if (e.target.value === '__NEW_CLIENT_FULL__') {
                    setShowFullClientModal(true);
                    return;
                  }
                  setValue('clientId', e.target.value, { shouldValidate: true });
                }}
                aria-invalid={!!errors.clientId}
                aria-describedby={errors.clientId ? 'clientId-error' : undefined}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">Sélectionner un client...</option>
                <optgroup label="Actions création directe">
                  <option value="__NEW_CLIENT_INLINE__">➕ + Ajouter un nouveau client (Création rapide ici)</option>
                  <option value="__NEW_CLIENT_FULL__">📄 + Créer avec scanner de permis OCR</option>
                </optgroup>
                <optgroup label="Clients enregistrés">
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.email}) • {c.phone}
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Just added client feedback banner */}
              {justAddedClient && watchedClientId === justAddedClient.id && (
                <div className="mt-1.5 flex items-center gap-2 p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">
                    Nouveau client <strong>{justAddedClient.firstName} {justAddedClient.lastName}</strong> créé et sélectionné !
                  </span>
                </div>
              )}

              {/* Selected client details chip if not just created */}
              {selectedClient && (!justAddedClient || watchedClientId !== justAddedClient.id) && (
                <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-between gap-2">
                  <span className="truncate">
                    {selectedClient.phone} • Permis : <span className="font-mono text-cyan-400">{selectedClient.licenseNumber}</span>
                  </span>
                  {selectedClient.vipStatus && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                      VIP
                    </span>
                  )}
                </div>
              )}

              {errors.clientId && (
                <p id="clientId-error" className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.clientId.message}
                </p>
              )}

              {/* Inline Quick Add Client Panel */}
              {showQuickAddClient && (
                <div className="mt-2.5 p-3.5 rounded-xl bg-slate-850 border border-blue-500/40 shadow-xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      Création Rapide du Client
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddClient(false)}
                      className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {quickError && (
                    <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 p-1.5 rounded-lg flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {quickError}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Prénom *"
                        value={quickFirstName}
                        onChange={(e) => {
                          setQuickFirstName(e.target.value);
                          if (quickError) setQuickError('');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nom de famille *"
                        value={quickLastName}
                        onChange={(e) => {
                          setQuickLastName(e.target.value);
                          if (quickError) setQuickError('');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="tel"
                        placeholder="Téléphone *"
                        value={quickPhone}
                        onChange={(e) => {
                          setQuickPhone(e.target.value);
                          if (quickError) setQuickError('');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email (facultatif)"
                        value={quickEmail}
                        onChange={(e) => setQuickEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Numéro de permis (facultatif)"
                      value={quickLicense}
                      onChange={(e) => setQuickLicense(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddClient(false);
                        setShowFullClientModal(true);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Formulaire complet & OCR
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowQuickAddClient(false)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateClientQuick}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md shadow-blue-600/30 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Créer & Sélectionner
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-start-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Date de début (Départ) *
              </label>
              <input
                id="booking-start-date"
                type="date"
                {...register('startDate')}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.startDate && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="booking-end-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Date de fin (Restitution) *
              </label>
              <input
                id="booking-end-date"
                type="date"
                {...register('endDate')}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.endDate && (
                <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="booking-pickup-loc" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Lieu de prise en charge *
              </label>
              <input
                id="booking-pickup-loc"
                type="text"
                {...register('pickupLocation')}
                placeholder="Ex: Agence Gare Centrale"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pickupLocation && (
                <p className="mt-1 text-[11px] text-rose-400">{errors.pickupLocation.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="booking-return-loc" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Lieu de restitution *
              </label>
              <input
                id="booking-return-loc"
                type="text"
                {...register('returnLocation')}
                placeholder="Ex: Agence Gare Centrale"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.returnLocation && (
                <p className="mt-1 text-[11px] text-rose-400">{errors.returnLocation.message}</p>
              )}
            </div>
          </div>

          {/* Row 4: Pricing, Insurance, Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="booking-rate" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Tarif / jour (DT) *
              </label>
              <input
                id="booking-rate"
                type="number"
                step="0.5"
                {...register('dailyRate', { valueAsNumber: true })}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="booking-insurance" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Formule Assurance
              </label>
              <select
                id="booking-insurance"
                {...register('insuranceTier')}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BASIC">Basique (Franchise 1500 DT)</option>
                <option value="STANDARD">Standard (Franchise 800 DT)</option>
                <option value="PREMIUM">Premium Zero Franchise</option>
              </select>
            </div>

            <div>
              <label htmlFor="booking-deposit" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dépôt Caution (DT) *
              </label>
              <input
                id="booking-deposit"
                type="number"
                step="50"
                {...register('depositAmount', { valueAsNumber: true })}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Pricing summary widget */}
          <div className="rounded-xl bg-blue-950/40 border border-blue-500/30 p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Calcul Prévisionnel
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                {durationDays} jour{durationDays > 1 ? 's' : ''} × {watchedDailyRate || 0} DT + TVA 20%
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total TTC estimé</span>
              <span className="text-lg font-black text-emerald-400">
                {(estimatedTotal || 0).toFixed(2)} DT
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Création en cours...' : 'Créer la réservation'}
            </button>
          </div>
        </form>
      </div>

      {/* Full New Client Modal with License OCR */}
      {showFullClientModal && (
        <NewClientModal
          isOpen={showFullClientModal}
          onClose={() => setShowFullClientModal(false)}
          onSuccess={(newClient) => {
            setValue('clientId', newClient.id, { shouldValidate: true });
            setJustAddedClient(newClient);
            setShowQuickAddClient(false);
            setShowFullClientModal(false);
          }}
        />
      )}
    </div>
  );
};
