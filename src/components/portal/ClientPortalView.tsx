import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vehicle } from '../../types';
import { QuantumFluxLogo } from '../ui/QuantumFluxLogo';
import {
  Car,
  Calendar,
  CreditCard,
  Check,
  ShieldCheck,
  MapPin,
  Sparkles,
  Search,
  CheckCircle2,
  Users,
  Zap,
  Fuel,
  Luggage,
  Shield,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { TactileInput } from '../ui/TactileInput';
import confetti from 'canvas-confetti';

export const ClientPortalView: React.FC = () => {
  const { vehicles, currentAgency, addBooking, currentUser } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [startDate, setStartDate] = useState('2026-09-04');
  const [endDate, setEndDate] = useState('2026-09-07');
  const [durationDays, setDurationDays] = useState(3);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBookingNum, setCreatedBookingNum] = useState('');

  const availableList = vehicles.filter(v => {
    if (v.status !== 'AVAILABLE') return false;
    if (selectedCategory !== 'ALL' && v.category !== selectedCategory) return false;
    return true;
  });

  const categories = [
    { id: 'ALL', label: 'Tous', count: vehicles.filter(v => v.status === 'AVAILABLE').length },
    { id: 'CITADINE', label: 'Citadines', count: vehicles.filter(v => v.status === 'AVAILABLE' && v.category === 'CITADINE').length },
    { id: 'SUV', label: 'SUV', count: vehicles.filter(v => v.status === 'AVAILABLE' && v.category === 'SUV').length },
    { id: 'COMPACTE', label: 'Compactes', count: vehicles.filter(v => v.status === 'AVAILABLE' && v.category === 'COMPACTE').length },
    { id: 'ELECTRIQUE', label: 'Électrique', count: vehicles.filter(v => v.status === 'AVAILABLE' && v.category === 'ELECTRIQUE').length },
    { id: 'PREMIUM', label: 'Premium', count: vehicles.filter(v => v.status === 'AVAILABLE' && v.category === 'PREMIUM').length },
  ];

  const handleBookVehicle = (v: Vehicle) => {
    const subtotal = v.dailyRate * durationDays;
    const tax = subtotal * 0.2;
    const total = subtotal + tax;

    const newBk = addBooking({
      clientId: currentUser.id,
      clientName: currentUser.name,
      clientPhone: currentUser.phone || '+33 6 88 12 34 56',
      clientEmail: currentUser.email,
      vehicleId: v.id,
      vehicleName: `${v.brand} ${v.model}`,
      vehiclePlate: v.plate,
      vehicleImageUrl: v.images[0],
      agencyId: currentAgency.id,
      startDate,
      endDate,
      startTime: '10:00',
      endTime: '18:00',
      dailyRate: v.dailyRate,
      durationDays,
      includedKm: durationDays * 250,
      selectedExtras: ['ext-all-inclusive'],
      extrasTotal: 45,
      rentalSubtotal: subtotal,
      tax,
      totalAmount: total + 45,
      depositAmount: v.depositAmount,
      paymentMethod: 'STRIPE_CARD',
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    });

    setCreatedBookingNum(newBk.bookingNumber);
    setIsSuccess(true);

    try {
      confetti({ particleCount: 100, spread: 70 });
    } catch (e) {}
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-5 select-none animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            Réservation Confirmée
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Votre véhicule vous attend !</h2>
        </div>
        <div className="w-full p-4 rounded-2xl bg-[#10172A] border border-gray-800 flex flex-col gap-2 text-left">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-800">
            <span className="text-gray-400">Numéro de confirmation</span>
            <span className="font-mono font-bold text-cyan-300">{createdBookingNum}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-800">
            <span className="text-gray-400">Agence de retrait</span>
            <span className="font-bold text-white">{currentAgency.name}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Dates</span>
            <span className="font-bold text-white">{startDate} ➔ {endDate} ({durationDays}j)</span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Présentez-vous directement en agence avec votre permis de conduire original pour récupérer les clés en moins de 2 minutes.
        </p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="w-full min-h-[50px] rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          Nouvelle Recherche de Véhicule
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-5 pb-32 flex flex-col gap-4 sm:gap-5 select-none">
      {/* Mobile Hero Banner */}
      <div className="bg-gradient-to-br from-[#0C1A38] via-[#10234C] to-[#0A1630] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cyan-500/30 text-white shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-cyan-300 font-mono">
              Portail Client Direct • {currentAgency.city}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-0.5">Louez votre véhicule en 3 clics</h1>
          <p className="text-xs text-slate-300">
            Flotte mobilité connectée & clé digitale instantanée par {currentAgency.name}.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono font-bold flex items-center gap-1 text-cyan-200">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Assurance Tout Inclus
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono font-bold flex items-center gap-1 text-cyan-200">
              <Zap className="w-3 h-3 text-yellow-400" />
              Retrait Express 2 min
            </span>
          </div>
        </div>
        <div className="hidden sm:block">
          <QuantumFluxLogo variant="horizontal" size="sm" showSubtitle={false} className="p-3 bg-black/40 rounded-2xl border border-cyan-500/20" />
        </div>
      </div>

      {/* Quick Dates & Duration Picker on Mobile */}
      <div className="bg-[#10172A] p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-800 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Période de Location</span>
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {durationDays} jour{durationDays > 1 ? 's' : ''}
          </span>
        </div>

        {/* Quick Duration Preset Chips */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setDurationDays(3);
              setStartDate('2026-09-04');
              setEndDate('2026-09-07');
            }}
            className={`min-h-[38px] px-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer active:scale-95 ${
              durationDays === 3
                ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                : 'bg-[#151D33] text-gray-300 border-gray-800'
            }`}
          >
            Week-end (3j)
          </button>
          <button
            type="button"
            onClick={() => {
              setDurationDays(7);
              setStartDate('2026-09-04');
              setEndDate('2026-09-11');
            }}
            className={`min-h-[38px] px-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer active:scale-95 ${
              durationDays === 7
                ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                : 'bg-[#151D33] text-gray-300 border-gray-800'
            }`}
          >
            1 Semaine (7j)
          </button>
          <button
            type="button"
            onClick={() => {
              setDurationDays(14);
              setStartDate('2026-09-04');
              setEndDate('2026-09-18');
            }}
            className={`min-h-[38px] px-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer active:scale-95 ${
              durationDays === 14
                ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                : 'bg-[#151D33] text-gray-300 border-gray-800'
            }`}
          >
            2 Semaines (14j)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <TactileInput
            label="Date de Départ"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <TactileInput
            label="Date de Restitution"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`min-h-[42px] px-3.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                : 'bg-[#131B2E] text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>{cat.label}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/40 text-gray-300">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Vehicle Grid (Optimized for Mobile Touch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {availableList.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-[#10172A] rounded-3xl border border-gray-800">
            <Car className="w-10 h-10 text-gray-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">Aucun véhicule disponible dans cette catégorie</h3>
            <p className="text-xs text-gray-400 mt-1">Sélectionnez une autre catégorie ou modifiez vos dates.</p>
          </div>
        ) : (
          availableList.map(v => {
            const totalPrice = Math.round(v.dailyRate * durationDays * 1.2 + 45);
            return (
              <div
                key={v.id}
                className="bg-[#10172A] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-800/90 shadow-xl flex flex-col justify-between gap-3 hover:border-gray-700 transition-all"
              >
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden h-40 sm:h-44 bg-slate-900">
                  <img src={v.images[0]} alt={v.model} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                    {v.category}
                  </div>
                  <div className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-xs font-mono font-bold text-emerald-400 border border-emerald-500/30">
                    {v.dailyRate.toFixed(0)} DT / jour
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-base">
                      {v.brand} {v.model}
                    </h3>
                    <span className="font-mono text-xs text-gray-400">
                      {v.year}
                    </span>
                  </div>

                  {/* Spec Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-300 mt-1">
                    <span className="px-2 py-0.5 rounded-lg bg-[#151D33] border border-gray-800 flex items-center gap-1 font-mono">
                      <Users className="w-3 h-3 text-cyan-400" />
                      {v.seats} pl.
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#151D33] border border-gray-800 flex items-center gap-1 font-mono">
                      <Fuel className="w-3 h-3 text-emerald-400" />
                      {v.fuelType}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#151D33] border border-gray-800 flex items-center gap-1 font-mono">
                      {v.transmission}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-400 font-mono">Total {durationDays} jours</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono">{totalPrice} DT <span className="text-[10px] font-normal text-gray-400">TTC</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBookVehicle(v)}
                    className="min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white uppercase text-xs tracking-wider shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Réserver</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

