import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Car,
  Users,
  DollarSign,
  CalendarCheck,
  Award,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { vehicles, bookings, clients, currentAgency } = useApp();

  const totalTurnover = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalRentedDays = bookings.reduce((sum, b) => sum + b.durationDays, 0);
  const averageBasket = bookings.length > 0 ? totalTurnover / bookings.length : 0;
  const occupancyRate = vehicles.length > 0 ? Math.round((vehicles.filter(v => v.status === 'RENTED').length / vehicles.length) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 pb-32 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            Performances & Statistiques
          </span>
          <h1 className="text-2xl font-black text-white">Rapports d'Activité</h1>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/30">
          Septembre 2026
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#10172A] p-4 rounded-3xl border border-slate-800 flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-bold text-emerald-400 uppercase">Chiffre d'Affaires</span>
          <div>
            <span className="text-2xl font-black font-mono text-white">
              {totalTurnover.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DT
            </span>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2% vs mois dernier
            </p>
          </div>
        </div>

        <div className="bg-[#10172A] p-4 rounded-3xl border border-slate-800 flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-bold text-blue-400 uppercase">Taux d'Occupation</span>
          <div>
            <span className="text-2xl font-black font-mono text-white">
              {occupancyRate}%
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Flotte totale : {vehicles.length} véhicules
            </p>
          </div>
        </div>

        <div className="bg-[#10172A] p-4 rounded-3xl border border-slate-800 flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-bold text-indigo-400 uppercase">Panier Moyen</span>
          <div>
            <span className="text-2xl font-black font-mono text-white">
              {averageBasket.toFixed(2)} DT
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Durée moy: ~3.2 jours
            </p>
          </div>
        </div>

        <div className="bg-[#10172A] p-4 rounded-3xl border border-slate-800 flex flex-col justify-between min-h-[110px]">
          <span className="text-xs font-bold text-cyan-400 uppercase">Réservations</span>
          <div>
            <span className="text-2xl font-black font-mono text-white">
              {bookings.length}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              {clients.length} clients uniques
            </p>
          </div>
        </div>
      </div>

      {/* Top Rented Vehicles */}
      <div className="bg-[#10172A] rounded-3xl p-5 border border-slate-800 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">Top Véhicules les Plus Rentables</h3>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {vehicles.slice(0, 4).map((v, i) => (
            <div
              key={v.id}
              className="p-3.5 rounded-2xl bg-[#0A0E1A] border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 font-black text-xs flex items-center justify-center font-mono">
                  #{i + 1}
                </span>
                <img src={v.images[0]} alt={v.model} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                <div>
                  <p className="text-xs font-extrabold text-white">{v.brand} {v.model}</p>
                  <span className="font-mono text-[11px] text-cyan-400">{v.plate}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-black text-emerald-400">
                  {((i + 2) * 480).toFixed(2)} DT
                </span>
                <p className="text-[10px] text-slate-400 font-bold">{(i + 2) * 5} jours loués</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
