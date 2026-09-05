import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingFormSchema, BookingFormData } from '../../schemas';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Shield, MapPin, DollarSign, Car, User, AlertCircle } from 'lucide-react';
import { Vehicle } from '../../types';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicleId?: string;
  preselectedStartDate?: string;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicleId,
  preselectedStartDate,
}) => {
  const { vehicles, clients, addBooking, currentAgency } = useApp();

  const availableVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      if (a.id === preselectedVehicleId) return -1;
      if (b.id === preselectedVehicleId) return 1;
      if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
      if (b.status === 'AVAILABLE' && a.status !== 'AVAILABLE') return 1;
      return 0;
    });
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
      vehicleId: preselectedVehicleId || availableVehicles[0]?.id || '',
      clientId: clients[0]?.id || '',
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      pickupLocation: 'Aéroport Paris-Charles de Gaulle (CDG)',
      returnLocation: 'Aéroport Paris-Charles de Gaulle (CDG)',
      insuranceTier: 'STANDARD',
      dailyRate: availableVehicles[0]?.dailyRate || 65,
      depositAmount: 500,
      notes: '',
    },
  });

  // Re-sync form values whenever modal opens or preselected props change
  React.useEffect(() => {
    if (isOpen) {
      const start = preselectedStartDate || new Date().toISOString().split('T')[0];
      const d = new Date(start);
      d.setDate(d.getDate() + 3);
      const end = d.toISOString().split('T')[0];

      const chosenVehicleId = preselectedVehicleId || availableVehicles[0]?.id || '';
      const chosenVehicle = vehicles.find((v) => v.id === chosenVehicleId);

      reset({
        vehicleId: chosenVehicleId,
        clientId: clients[0]?.id || '',
        startDate: start,
        endDate: end,
        pickupLocation: 'Aéroport Paris-Charles de Gaulle (CDG)',
        returnLocation: 'Aéroport Paris-Charles de Gaulle (CDG)',
        insuranceTier: 'STANDARD',
        dailyRate: chosenVehicle?.dailyRate || availableVehicles[0]?.dailyRate || 65,
        depositAmount: 500,
        notes: '',
      });
    }
  }, [isOpen, preselectedStartDate, preselectedVehicleId, vehicles, clients, availableVehicles, reset]);

  const watchedVehicleId = watch('vehicleId');
  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');
  const watchedDailyRate = watch('dailyRate');

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
              <label htmlFor="booking-vehicle" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-blue-400" />
                Véhicule *
              </label>
              <select
                id="booking-vehicle"
                {...register('vehicleId')}
                aria-invalid={!!errors.vehicleId}
                aria-describedby={errors.vehicleId ? 'vehicleId-error' : undefined}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un véhicule</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plate}) — {v.dailyRate} €/j
                  </option>
                ))}
              </select>
              {errors.vehicleId && (
                <p id="vehicleId-error" className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.vehicleId.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="booking-client" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Client *
              </label>
              <select
                id="booking-client"
                {...register('clientId')}
                aria-invalid={!!errors.clientId}
                aria-describedby={errors.clientId ? 'clientId-error' : undefined}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p id="clientId-error" className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.clientId.message}
                </p>
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
                Tarif / jour (€) *
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
                <option value="BASIC">Basique (Franchise 1500€)</option>
                <option value="STANDARD">Standard (Franchise 800€)</option>
                <option value="PREMIUM">Premium Zero Franchise</option>
              </select>
            </div>

            <div>
              <label htmlFor="booking-deposit" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dépôt Caution (€) *
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
                {durationDays} jour{durationDays > 1 ? 's' : ''} × {watchedDailyRate || 0} € + TVA 20%
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total TTC estimé</span>
              <span className="text-lg font-black text-emerald-400">
                {estimatedTotal.toFixed(2)} €
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
    </div>
  );
};
