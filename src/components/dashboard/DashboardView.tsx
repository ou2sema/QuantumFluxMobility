import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useBooking } from '../../hooks/useBooking';
import { useAuth } from '../../hooks/useAuth';
import {
  Key,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Search,
  Car,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Fuel,
  Gauge,
  Camera,
  X,
  Sparkles,
  ChevronRight,
  Layers,
  Wrench,
  Eye,
  Plus
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';
import { Vehicle } from '../../types';
import { VehicleDetailModal } from '../fleet/VehicleDetailModal';

interface DashboardViewProps {
  onOpenBookingWizard: (vehicleId?: string) => void;
  onOpenPlateScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenBookingWizard,
  onOpenPlateScanner,
}) => {
  const {
    vehicles,
    clients,
    notifications,
    currentUser,
    currentAgency,
    setActiveTab,
    setSelectedBookingForCheckIn,
    setSelectedBookingForCheckOut,
  } = useApp();

  const {
    todayCheckIns,
    todayCheckOuts,
    inProgressBookings,
    bookings,
    startCheckInFlow,
    startCheckOutFlow,
  } = useBooking();

  const { isManagerOrAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileOperationsFilter, setMobileOperationsFilter] = useState<'ALL' | 'CHECKIN' | 'CHECKOUT' | 'AVAILABLE' | 'FLEET'>('ALL');
  const [fleetSubFilter, setFleetSubFilter] = useState<'ALL' | 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'MAINTENANCE'>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Fleet occupancy calculations
  const totalVehicles = vehicles.length;
  const rentedVehicles = vehicles.filter(v => v.status === 'RENTED').length;
  const reservedVehicles = vehicles.filter(v => v.status === 'RESERVED').length;
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'MAINTENANCE').length;
  const occupancyRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

  // Filtered items when searching plate or client
  const searchResults = searchTerm.trim()
    ? bookings.filter(
        b =>
          b.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const unreadAlertsCount = notifications.filter(n => !n.read).length;

  // Real-time filtered vehicles list for Available & Fleet sections
  const availableVehiclesList = vehicles
    .filter(v => v.status === 'AVAILABLE')
    .filter(v => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        v.plate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    });

  const displayedFleetVehicles = vehicles
    .filter(v => {
      if (fleetSubFilter === 'ALL') return true;
      return v.status === fleetSubFilter;
    })
    .filter(v => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        v.plate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    });

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-6 pb-32 flex flex-col gap-4 sm:gap-6 select-none">
      {/* Mobile Top Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-br from-[#0F172E] via-[#131E3D] to-[#0A1024] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-cyan-500/20 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
                {currentAgency.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{currentUser.name.split(' ')[0]}</span> 👋
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
              Flotte dispo : {availableVehicles}/{totalVehicles}
            </span>
          </div>
        </div>

        {/* Mobile Quick Action Buttons (1-Tap direct shortcuts) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenBookingWizard}
            className="min-h-[52px] p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer border border-blue-400/40"
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-tight leading-tight whitespace-normal text-left sm:text-center">
              Nouvelle Réservation
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenPlateScanner}
            className="min-h-[50px] p-2.5 rounded-xl bg-[#17223D] hover:bg-[#1E2C4F] text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-tight truncate">
              Scanner Plaque
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileOperationsFilter('CHECKIN');
            }}
            className="min-h-[50px] p-2.5 rounded-xl bg-[#17223D] hover:bg-[#1E2C4F] text-emerald-300 border border-emerald-500/30 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-tight truncate">
              Départs ({todayCheckIns.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileOperationsFilter('CHECKOUT');
            }}
            className="min-h-[50px] p-2.5 rounded-xl bg-[#17223D] hover:bg-[#1E2C4F] text-blue-300 border border-blue-500/30 font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-tight truncate">
              Retours ({todayCheckOuts.length})
            </span>
          </button>
        </div>

        {/* Integrated Quick Search Input with Scan Shortcut */}
        <div className="relative w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Recherche plaque (ex: 75-XP-22), client, n° dossier..."
            className="w-full h-11 sm:h-12 pl-10 pr-20 rounded-xl bg-[#0A0E1A]/90 border border-gray-800 text-white placeholder-gray-500 font-medium text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="w-7 h-7 rounded-lg bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenPlateScanner}
                className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                title="Scanner OCR"
              >
                <Camera className="w-3 h-3" />
                <span className="hidden xs:inline">SCAN</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* If search active, display search results */}
      {searchTerm.trim() && (
        <div className="bg-[#151B30] rounded-2xl p-4 sm:p-5 border border-cyan-500/50 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
              Résultats de recherche ({searchResults.length})
            </span>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-gray-400 hover:text-white font-bold uppercase tracking-wider"
            >
              Effacer
            </button>
          </div>

          {searchResults.length === 0 ? (
            <p className="text-xs text-gray-400 p-4 text-center">Aucune réservation ne correspond à cette recherche.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map(bk => (
                <div
                  key={bk.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#0A0E1A] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-cyan-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-cyan-400 flex-shrink-0 border border-gray-700">
                      {bk.vehiclePlate}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{bk.vehicleName}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Client : <strong className="text-gray-200">{bk.clientName}</strong> • {bk.bookingNumber}
                      </p>
                    </div>
                  </div>

                  {bk.status === 'CONFIRMED' ? (
                    <TactileButton
                      size="normal"
                      variant="success"
                      icon={Key}
                      onClick={() => startCheckInFlow(bk)}
                    >
                      Valider Check-in
                    </TactileButton>
                  ) : bk.status === 'IN_PROGRESS' ? (
                    <TactileButton
                      size="normal"
                      variant="primary"
                      icon={RotateCcw}
                      onClick={() => startCheckOutFlow(bk)}
                    >
                      Faire Check-out
                    </TactileButton>
                  ) : (
                    <StatusBadge status={bk.status} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metric Cards (2x2 Grid on Mobile, 4 Cols on Desktop for Perfect Ergonomics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Check-Ins Today */}
        <div
          onClick={() => {
            setMobileOperationsFilter('CHECKIN');
          }}
          className={`p-3.5 sm:p-5 rounded-2xl border flex flex-col justify-between h-28 sm:h-36 cursor-pointer transition-all active:scale-95 shadow-md ${
            mobileOperationsFilter === 'CHECKIN'
              ? 'bg-[#10234C] border-emerald-400 ring-1 ring-emerald-400/40'
              : 'bg-[#151B30] border-gray-800 hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider font-mono truncate">
              Départs Jour
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1">
            <span className="text-2xl sm:text-4xl font-black text-white font-mono">{todayCheckIns.length}</span>
            <span className="text-emerald-400 text-xs font-mono font-bold">prêt(s)</span>
          </div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[75%]" />
          </div>
        </div>

        {/* Card 2: Returns Due */}
        <div
          onClick={() => {
            setMobileOperationsFilter('CHECKOUT');
          }}
          className={`p-3.5 sm:p-5 rounded-2xl border flex flex-col justify-between h-28 sm:h-36 cursor-pointer transition-all active:scale-95 shadow-md ${
            mobileOperationsFilter === 'CHECKOUT'
              ? 'bg-[#10234C] border-blue-400 ring-1 ring-blue-400/40'
              : 'bg-[#151B30] border-gray-800 hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider font-mono truncate">
              Retours Dus
            </span>
            <div className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1">
            <span className="text-2xl sm:text-4xl font-black text-blue-400 font-mono">
              {todayCheckOuts.length < 10 ? `0${todayCheckOuts.length}` : todayCheckOuts.length}
            </span>
            <span className="text-gray-400 text-xs font-mono">attendus</span>
          </div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-400 h-full w-[50%]" />
          </div>
        </div>

        {/* Card 3: Fleet Occupancy */}
        <div
          onClick={() => {
            setMobileOperationsFilter('AVAILABLE');
          }}
          className={`p-3.5 sm:p-5 rounded-2xl border flex flex-col justify-between h-28 sm:h-36 cursor-pointer transition-all active:scale-95 shadow-md ${
            mobileOperationsFilter === 'AVAILABLE'
              ? 'bg-[#10234C] border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-500/20'
              : 'bg-[#151B30] border-gray-800 hover:border-cyan-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider font-mono truncate">
              Disponibles
            </span>
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1">
            <span className="text-2xl sm:text-4xl font-black text-white font-mono">{availableVehicles}</span>
            <span className="text-gray-400 text-xs font-mono">/ {totalVehicles}</span>
          </div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full" style={{ width: `${totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Card 4: Alerts / Pending */}
        <div
          onClick={() => setActiveTab('clients')}
          className="bg-[#151B30] p-3.5 sm:p-5 rounded-2xl border border-gray-800 flex flex-col justify-between h-28 sm:h-36 cursor-pointer hover:border-gray-700 transition-all active:scale-95 shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider font-mono truncate">
              Alertes
            </span>
            <div className="w-2 h-2 rounded-full bg-orange-400" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 text-orange-400">
            <span className="text-2xl sm:text-4xl font-black font-mono">{unreadAlertsCount}</span>
            <span className="text-[11px] text-gray-400 font-mono">requise(s)</span>
          </div>
          <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
            <div className="bg-orange-400 h-full w-[60%]" />
          </div>
        </div>
      </div>

      {/* Mobile Operations Filter Segmented Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-[#10172A] rounded-xl border border-gray-800 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setMobileOperationsFilter('ALL')}
          className={`flex-1 min-h-[38px] px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
            mobileOperationsFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Tous les Flux
        </button>
        <button
          type="button"
          onClick={() => setMobileOperationsFilter('CHECKIN')}
          className={`flex-1 min-h-[38px] px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center justify-center gap-1 ${
            mobileOperationsFilter === 'CHECKIN'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Départs</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[10px]">
            {todayCheckIns.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileOperationsFilter('CHECKOUT')}
          className={`flex-1 min-h-[38px] px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center justify-center gap-1 ${
            mobileOperationsFilter === 'CHECKOUT'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Retours</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 text-[10px]">
            {todayCheckOuts.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileOperationsFilter('AVAILABLE')}
          className={`flex-1 min-h-[38px] px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center justify-center gap-1 ${
            mobileOperationsFilter === 'AVAILABLE'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Disponibles</span>
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold">
            {availableVehicles}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileOperationsFilter('FLEET')}
          className={`flex-1 min-h-[38px] px-3 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-95 flex items-center justify-center gap-1 ${
            mobileOperationsFilter === 'FLEET'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>Flotte</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold">
            {totalVehicles}
          </span>
        </button>
      </div>

      {/* Main Content Grid: Dynamic based on Mobile Filter & Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Operations Feeds */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Check-Ins Section */}
          {(mobileOperationsFilter === 'ALL' || mobileOperationsFilter === 'CHECKIN') && (
            <div className="bg-[#151B30] rounded-2xl border border-gray-800 flex flex-col overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-gray-800 flex justify-between items-center bg-[#17203A]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-sm sm:text-base font-bold text-white">Départs & Check-Ins du Jour</h2>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-800/50 uppercase font-mono">
                  {todayCheckIns.length} Prêt(s)
                </span>
              </div>

              <div className="p-3 sm:p-4 space-y-2.5">
                {todayCheckIns.length === 0 ? (
                  <div className="p-6 text-center bg-[#0A0E1A] rounded-xl border border-gray-800">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Tous les départs du jour sont validés</p>
                  </div>
                ) : (
                  todayCheckIns.map(booking => (
                    <div
                      key={booking.id}
                      className="bg-[#0A0E1A] p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border-l-4 border-emerald-500 border border-gray-800/80 gap-3 hover:border-gray-700 transition-all shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center font-mono text-xs font-black text-cyan-300 border border-cyan-500/30 flex-shrink-0 shadow-inner">
                          {booking.vehiclePlate}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-white text-sm truncate">
                            {booking.vehicleName}
                          </span>
                          <span className="text-xs text-gray-400 truncate">
                            Client : <strong className="text-gray-200">{booking.clientName}</strong> • {booking.startTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                          PRÊT SIGNATURE
                        </span>
                        <button
                          type="button"
                          onClick={() => startCheckInFlow(booking)}
                          className="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 px-5 rounded-xl font-bold text-white uppercase text-xs tracking-wider shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Valider</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Check-Outs Section */}
          {(mobileOperationsFilter === 'ALL' || mobileOperationsFilter === 'CHECKOUT') && (
            <div className="bg-[#151B30] rounded-2xl border border-gray-800 flex flex-col overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-gray-800 flex justify-between items-center bg-[#17203A]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                  <h2 className="text-sm sm:text-base font-bold text-white">Retours & Restitutions en Cours</h2>
                </div>
                <span className="px-2.5 py-0.5 bg-blue-950/80 text-blue-400 text-[11px] font-bold rounded-full border border-blue-800/50 uppercase font-mono">
                  Flux en Direct
                </span>
              </div>

              <div className="p-3 sm:p-4 space-y-2.5">
                {todayCheckOuts.length === 0 ? (
                  <div className="p-6 text-center bg-[#0A0E1A] rounded-xl border border-gray-800">
                    <CheckCircle2 className="w-7 h-7 text-blue-400 mx-auto mb-1.5 opacity-80" />
                    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Aucun retour de véhicule en attente</p>
                  </div>
                ) : (
                  todayCheckOuts.map(booking => (
                    <div
                      key={booking.id}
                      className="bg-[#0A0E1A] p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border-l-4 border-blue-500 border border-gray-800/80 gap-3 hover:border-gray-700 transition-all shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center font-mono text-xs font-black text-cyan-300 border border-cyan-500/30 flex-shrink-0 shadow-inner">
                          {booking.vehiclePlate}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-white text-sm truncate">
                            {booking.vehicleName}
                          </span>
                          <span className="text-xs text-gray-400 truncate">
                            Client : <strong className="text-gray-200">{booking.clientName}</strong> • Retour {booking.endTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                        <span className="text-[10px] font-mono text-gray-400 italic">
                          RETOUR EN COURS
                        </span>
                        <button
                          type="button"
                          onClick={() => startCheckOutFlow(booking)}
                          className="min-h-[44px] bg-blue-600 hover:bg-blue-500 px-5 rounded-xl font-bold text-white uppercase text-xs tracking-wider shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Inspecter</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Available Vehicles Section */}
          {mobileOperationsFilter === 'AVAILABLE' && (
            <div className="bg-[#151B30] rounded-2xl border border-cyan-500/30 flex flex-col overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-gray-800 flex justify-between items-center bg-[#17203A]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <h2 className="text-sm sm:text-base font-bold text-white">Véhicules Disponibles Immédiatement</h2>
                </div>
                <span className="px-2.5 py-0.5 bg-cyan-950/80 text-cyan-300 text-[11px] font-bold rounded-full border border-cyan-800/50 uppercase font-mono">
                  {availableVehiclesList.length} Disponible(s)
                </span>
              </div>

              <div className="p-3 sm:p-4 space-y-3">
                {availableVehiclesList.length === 0 ? (
                  <div className="p-8 text-center bg-[#0A0E1A] rounded-xl border border-gray-800">
                    <Car className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-bold text-white">Aucun véhicule disponible correspondant</p>
                    <p className="text-xs text-gray-400 mt-1">Tous les véhicules sont actuellement en location ou en révision atelier.</p>
                  </div>
                ) : (
                  availableVehiclesList.map(vehicle => (
                    <div
                      key={vehicle.id}
                      className="bg-[#0A0E1A] p-3.5 sm:p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between border-l-4 border-emerald-500 border border-gray-800/80 gap-3 hover:border-gray-700 transition-all shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-900 overflow-hidden border border-gray-800 flex-shrink-0">
                          <img
                            src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-[9px] font-mono font-bold text-cyan-300 rounded">
                            {vehicle.dailyRate}€/j
                          </span>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black text-cyan-300 border border-cyan-500/30">
                              {vehicle.plate}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                              {vehicle.category}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                              Disponible
                            </span>
                          </div>

                          <h3 className="font-black text-white text-base truncate mt-1">
                            {vehicle.brand} {vehicle.model}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                            <span>{vehicle.mileage.toLocaleString()} km</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {vehicle.fuelType === 'ELECTRIQUE' ? '⚡' : '⛽'} {vehicle.currentFuelLevel}% {vehicle.fuelType}
                            </span>
                            <span>•</span>
                            <span>{vehicle.transmission === 'AUTOMATIQUE' ? 'BVA' : 'BVM'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-800/80">
                        <button
                          type="button"
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="min-h-[42px] px-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-gray-700 active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Fiche</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenBookingWizard(vehicle.id)}
                          className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Réserver</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Full Fleet Section */}
          {mobileOperationsFilter === 'FLEET' && (
            <div className="bg-[#151B30] rounded-2xl border border-indigo-500/30 flex flex-col overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-gray-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#17203A]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white">Parc Automobile de l'Agence</h2>
                    <p className="text-xs text-gray-400">{displayedFleetVehicles.length} sur {totalVehicles} véhicules</p>
                  </div>
                </div>

                {/* Sub-filters */}
                <div className="flex items-center gap-1 p-1 bg-[#0A0E1A] rounded-xl border border-gray-800 text-[11px] font-mono overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setFleetSubFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      fleetSubFilter === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Tous ({totalVehicles})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFleetSubFilter('AVAILABLE')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      fleetSubFilter === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-emerald-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Dispo ({availableVehicles})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFleetSubFilter('RESERVED')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      fleetSubFilter === 'RESERVED'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-purple-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Réservés ({reservedVehicles})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFleetSubFilter('RENTED')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      fleetSubFilter === 'RENTED'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-blue-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Loués ({rentedVehicles})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFleetSubFilter('MAINTENANCE')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      fleetSubFilter === 'MAINTENANCE'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-orange-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Atelier ({maintenanceVehicles})
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-3">
                {displayedFleetVehicles.length === 0 ? (
                  <div className="p-8 text-center bg-[#0A0E1A] rounded-xl border border-gray-800">
                    <Car className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-bold text-white">Aucun véhicule dans cette catégorie</p>
                  </div>
                ) : (
                  displayedFleetVehicles.map(vehicle => (
                    <div
                      key={vehicle.id}
                      className={`bg-[#0A0E1A] p-3.5 sm:p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between border-l-4 border border-gray-800/80 gap-3 hover:border-gray-700 transition-all shadow-md ${
                        vehicle.status === 'AVAILABLE'
                          ? 'border-l-emerald-500 hover:border-l-emerald-400'
                          : vehicle.status === 'RESERVED'
                          ? 'border-l-purple-500 hover:border-l-purple-400'
                          : vehicle.status === 'RENTED'
                          ? 'border-l-blue-500 hover:border-l-blue-400'
                          : 'border-l-orange-500 hover:border-l-orange-400'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-900 overflow-hidden border border-gray-800 flex-shrink-0">
                          <img
                            src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-[9px] font-mono font-bold text-white rounded">
                            {vehicle.dailyRate}€/j
                          </span>
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black text-cyan-300 border border-cyan-500/30">
                              {vehicle.plate}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                              {vehicle.category}
                            </span>
                            <StatusBadge status={vehicle.status} />
                          </div>

                          <h3 className="font-black text-white text-base truncate mt-1">
                            {vehicle.brand} {vehicle.model}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                            <span>{vehicle.mileage.toLocaleString()} km</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {vehicle.fuelType === 'ELECTRIQUE' ? '⚡' : '⛽'} {vehicle.currentFuelLevel}% {vehicle.fuelType}
                            </span>
                            <span>•</span>
                            <span>{vehicle.transmission === 'AUTOMATIQUE' ? 'BVA' : 'BVM'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-800/80">
                        <button
                          type="button"
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="min-h-[42px] px-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-gray-700 active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Fiche</span>
                        </button>

                        {vehicle.status === 'AVAILABLE' ? (
                          <button
                            type="button"
                            onClick={() => onOpenBookingWizard(vehicle.id)}
                            className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Réserver</span>
                          </button>
                        ) : vehicle.status === 'RESERVED' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const matchingBooking = bookings.find(b => b.vehicleId === vehicle.id && (b.status === 'CONFIRMED' || b.status === 'PENDING'));
                              if (matchingBooking) {
                                startCheckInFlow(matchingBooking);
                              } else {
                                setSelectedVehicle(vehicle);
                              }
                            }}
                            className="min-h-[42px] px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Départ / Clés</span>
                          </button>
                        ) : vehicle.status === 'RENTED' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const matchingBooking = inProgressBookings.find(b => b.vehicleId === vehicle.id) || bookings.find(b => b.vehicleId === vehicle.id && b.status === 'IN_PROGRESS');
                              if (matchingBooking) {
                                startCheckOutFlow(matchingBooking);
                              } else {
                                setSelectedVehicle(vehicle);
                              }
                            }}
                            className="min-h-[42px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restituer</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab('maintenance')}
                            className="min-h-[42px] px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-600/30 active:scale-95"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Atelier</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column / Mobile Fleet Overview Panel */}
        <aside className={`lg:col-span-4 flex flex-col gap-4 ${mobileOperationsFilter === 'FLEET' ? 'block' : 'hidden lg:flex'}`}>
          {/* Big Hero Button: New Reservation (Desktop/Tablet) */}
          <button
            type="button"
            onClick={() => onOpenBookingWizard()}
            className="w-full min-h-[72px] bg-blue-600 hover:bg-blue-500 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-98 transition-all group cursor-pointer border border-blue-400/40 p-4"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-active:scale-90 transition-transform">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black uppercase tracking-tight text-white whitespace-nowrap">
                Nouvelle Réservation
              </span>
              <span className="text-[11px] text-blue-200">
                Processus guidé en 3 étapes
              </span>
            </div>
          </button>

          {/* Fleet Status Card */}
          <div className="bg-[#151B30] p-5 rounded-2xl border border-gray-800 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" />
                <span>État du Parc & Flotte</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('fleet')}
                className="text-xs text-blue-400 hover:text-white font-mono font-bold"
              >
                Voir tout →
              </button>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => {
                  setMobileOperationsFilter('AVAILABLE');
                  setFleetSubFilter('AVAILABLE');
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer group ${
                  mobileOperationsFilter === 'AVAILABLE'
                    ? 'bg-emerald-950/40 border-emerald-500/40 ring-1 ring-emerald-500/30'
                    : 'border-transparent hover:border-emerald-500/30 hover:bg-emerald-950/20'
                }`}
                title="Cliquer pour afficher les véhicules disponibles"
              >
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-gray-300 font-medium group-hover:text-emerald-300 transition-colors">Disponible</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-white group-hover:text-emerald-300 transition-colors">{availableVehicles}</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0}%` }} />
                </div>
              </div>

              <div
                onClick={() => {
                  setMobileOperationsFilter('FLEET');
                  setFleetSubFilter('RENTED');
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer group ${
                  mobileOperationsFilter === 'FLEET' && fleetSubFilter === 'RENTED'
                    ? 'bg-blue-950/40 border-blue-500/40 ring-1 ring-blue-500/30'
                    : 'border-transparent hover:border-blue-500/30 hover:bg-blue-950/20'
                }`}
                title="Cliquer pour afficher les véhicules en location"
              >
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-gray-300 font-medium group-hover:text-blue-300 transition-colors">En Location / Sorti</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-blue-400 group-hover:text-blue-300 transition-colors">{rentedVehicles}</span>
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0}%` }} />
                </div>
              </div>

              <div
                onClick={() => {
                  setMobileOperationsFilter('FLEET');
                  setFleetSubFilter('MAINTENANCE');
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer group ${
                  mobileOperationsFilter === 'FLEET' && fleetSubFilter === 'MAINTENANCE'
                    ? 'bg-orange-950/40 border-orange-500/40 ring-1 ring-orange-500/30'
                    : 'border-transparent hover:border-orange-500/30 hover:bg-orange-950/20'
                }`}
                title="Cliquer pour afficher les véhicules en atelier"
              >
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-gray-300 font-medium group-hover:text-orange-300 transition-colors">En Atelier / Entretien</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-orange-400 group-hover:text-orange-300 transition-colors">{maintenanceVehicles}</span>
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${totalVehicles > 0 ? (maintenanceVehicles / totalVehicles) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Quick Launch Buttons (Scanner & Reporting) */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onOpenPlateScanner}
                  className="min-h-[50px] bg-gray-800/90 hover:bg-gray-700 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer p-2"
                >
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-200">Scanner Plaque</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="min-h-[50px] bg-gray-800/90 hover:bg-gray-700 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer p-2"
                >
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-200">Statistiques</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onStartBooking={(vehicleId) => {
            setSelectedVehicle(null);
            onOpenBookingWizard(vehicleId);
          }}
        />
      )}
    </div>
  );
};

