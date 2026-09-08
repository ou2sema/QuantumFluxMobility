import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings, useFleet, useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Plus,
  Car,
  Clock,
  User,
  Eye,
  CheckCircle2,
  FileText,
  X,
  List,
  CalendarDays,
  Search,
  ArrowRight,
  Key,
  ShieldCheck,
  Phone,
  Sparkles,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Booking, Vehicle } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { TactileButton } from '../ui/TactileButton';

interface BookingCalendarViewProps {
  onOpenBookingWizard?: (vehicleId?: string, startDate?: string) => void;
  onOpenInvoice?: (bookingId: string) => void;
}

export const BookingCalendarView: React.FC<BookingCalendarViewProps> = ({
  onOpenBookingWizard,
  onOpenInvoice,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    bookings,
    checkAndAutoUpdateBooking,
    checkAllBookingsLifecycle,
    setSelectedBookingForCheckIn,
    setSelectedBookingForCheckOut,
  } = useApp();
  const { vehicles } = useFleet();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [agendaSearch, setAgendaSearch] = useState('');
  
  // Selected day for the bottom day-agenda sheet (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Cell expansion state: on clicking a cell, it expands smoothly to prevent saturation and give full access to multiple reservations
  const [expandedDateStr, setExpandedDateStr] = useState<string | null>(null);

  const [activeBookingModal, setActiveBookingModal] = useState<Booking | null>(null);
  const [lastAutoAction, setLastAutoAction] = useState<'AUTO_CANCELLED' | 'AUTO_COMPLETED' | null>(null);

  // Close expanded cell when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedDateStr) {
        setExpandedDateStr(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedDateStr]);

  // Automated lifecycle sweep on calendar load:
  // - Overdue confirmed bookings without checkin -> auto CANCEL & vehicle AVAILABLE
  // - Bookings with arrival end date reached -> auto COMPLETE & vehicle AVAILABLE
  useEffect(() => {
    if (checkAllBookingsLifecycle) {
      checkAllBookingsLifecycle();
    }
  }, [checkAllBookingsLifecycle]);

  // Toggle cell expansion on cell click
  const handleCellClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setExpandedDateStr((prev) => (prev === dateStr ? null : dateStr));
  };

  // Click on reservation:
  // - If the day was passed and client didn't proceed with check-in -> auto CANCELLED & vehicle AVAILABLE
  // - If the end day comes -> auto COMPLETED & vehicle AVAILABLE
  // - Populates changes to all app modules
  const handleBookingClick = (booking: Booking) => {
    if (checkAndAutoUpdateBooking) {
      const result = checkAndAutoUpdateBooking(booking);
      setActiveBookingModal(result.booking);
      if (result.updated && result.reason) {
        setLastAutoAction(result.reason);
      } else {
        setLastAutoAction(null);
      }
    } else {
      setActiveBookingModal(booking);
      setLastAutoAction(null);
    }
  };

  // Month navigation
  const prevMonth = () => {
    setExpandedDateStr(null);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setExpandedDateStr(null);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const dateToday = now.toISOString().split('T')[0];
    setSelectedDateStr(dateToday);
    setExpandedDateStr(dateToday);
  };

  // Month grid calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b: Booking) => {
      if (selectedStatus !== 'ALL' && b.status !== selectedStatus) return false;
      if (selectedCategory !== 'ALL') {
        const v = vehicles.find((veh: Vehicle) => veh.id === b.vehicleId);
        if (v && v.category !== selectedCategory) return false;
      }
      return true;
    });
  }, [bookings, vehicles, selectedStatus, selectedCategory]);

  // Map bookings per date string YYYY-MM-DD
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};

    filteredBookings.forEach((b: Booking) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);

      // Iterate through each day of the booking
      let curr = new Date(start);
      while (curr <= end) {
        const key = curr.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        if (!map[key].some((existing) => existing.id === b.id)) {
          map[key].push(b);
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    return map;
  }, [filteredBookings]);

  // Bookings on the currently selected day
  const selectedDayBookings = useMemo(() => {
    return bookingsByDate[selectedDateStr] || [];
  }, [bookingsByDate, selectedDateStr]);

  // Agenda list (chronologically sorted bookings in the current month or matching search)
  const agendaBookings = useMemo(() => {
    return filteredBookings
      .filter((b) => {
        if (!agendaSearch.trim()) {
          // In month scope
          return b.startDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) ||
                 b.endDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
        }
        const query = agendaSearch.toLowerCase();
        return (
          b.clientName?.toLowerCase().includes(query) ||
          b.vehicleName?.toLowerCase().includes(query) ||
          b.bookingNumber?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [filteredBookings, year, month, agendaSearch]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v: Vehicle) => set.add(v.category));
    return Array.from(set);
  }, [vehicles]);

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PENDING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'IN_PROGRESS':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'COMPLETED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getStatusDotColor = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PENDING':
        return 'bg-blue-500 shadow-xs shadow-blue-500/50';
      case 'IN_PROGRESS':
        return 'bg-emerald-400 shadow-xs shadow-emerald-500/50';
      case 'COMPLETED':
        return 'bg-amber-400 shadow-xs shadow-amber-500/50';
      case 'CANCELLED':
        return 'bg-rose-500 shadow-xs shadow-rose-500/50';
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Réservation faite (Bleu)';
      case 'PENDING':
        return 'En attente (Bleu)';
      case 'IN_PROGRESS':
        return 'Check-in validé (Vert)';
      case 'COMPLETED':
        return 'Check-out / Fin de contrat (Jaune)';
      case 'CANCELLED':
        return 'Annulée (Rouge)';
      default:
        return status;
    }
  };

  const formatSelectedDateHuman = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dateObj);
    } catch {
      return dateStr;
    }
  };

  const handleStartCheckIn = (booking: Booking) => {
    setSelectedBookingForCheckIn(booking);
    navigate(`/checkin/${booking.id}`);
    setActiveBookingModal(null);
  };

  const handleStartCheckOut = (booking: Booking) => {
    setSelectedBookingForCheckOut(booking);
    navigate(`/checkout/${booking.id}`);
    setActiveBookingModal(null);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-36">
      {/* Header controls */}
      <div className="flex flex-col gap-3 bg-slate-900/80 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2 capitalize">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              {monthName}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Planning des départs, retours et réservations
            </p>
          </div>

          {/* View Mode Toggle: Mois ↔ Agenda */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Mois</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>
        </div>

        {/* Navigation and Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {/* Today button */}
            <button
              type="button"
              onClick={goToday}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              Aujourd'hui
            </button>

            {/* Nav arrows */}
            <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Mois précédent"
                className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Mois suivant"
                className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrer par catégorie"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Toutes catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status filter with user requested color codes */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filtrer par statut"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Tous statuts</option>
              <option value="CONFIRMED">Réservation faite (Bleu)</option>
              <option value="IN_PROGRESS">Check-in validé (Vert)</option>
              <option value="COMPLETED">Check-out / Échéance (Jaune)</option>
              <option value="CANCELLED">Annulée (Rouge)</option>
            </select>

            {/* New Booking quick action */}
            {onOpenBookingWizard && (
              <button
                type="button"
                onClick={() => onOpenBookingWizard(undefined, selectedDateStr)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Nouvelle</span>
                <span>Réservation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        <>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider py-0.5">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div className="text-blue-400 font-extrabold">Sam</div>
            <div className="text-blue-400 font-extrabold">Dim</div>
          </div>

          {/* Calendar Grid with Animated Cell Expansion */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 relative">
            {/* Backdrop when a cell is expanded */}
            <AnimatePresence>
              {expandedDateStr && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[1px]"
                  onClick={() => setExpandedDateStr(null)}
                />
              )}
            </AnimatePresence>

            {/* Empty cells before month start */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[64px] sm:min-h-[85px] md:min-h-[110px] rounded-xl bg-slate-900/20 border border-slate-800/30 p-1 opacity-25"
              />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
              const dayNumber = dayIdx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const isToday = todayStr === dateStr;
              const isSelected = selectedDateStr === dateStr;
              const isExpanded = expandedDateStr === dateStr;
              const dayBookings = bookingsByDate[dateStr] || [];
              const dayColumn = (firstDayIndex + dayIdx) % 7; // 0=Lun, 1=Mar, 2=Mer, 3=Jeu, 4=Ven, 5=Sam, 6=Dim

              return (
                <motion.div
                  layout
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  key={dateStr}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  aria-label={`Jour ${dayNumber}, ${dayBookings.length} réservations. Cliquez pour ${isExpanded ? 'réduire' : 'agrandir la cellule'}`}
                  onClick={() => handleCellClick(dateStr)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCellClick(dateStr);
                    }
                  }}
                  className={`group rounded-xl border transition-colors select-none relative ${
                    isExpanded
                      ? 'z-30 min-h-[290px] sm:min-h-[320px] md:min-h-[360px] bg-slate-900 border-2 border-blue-500 ring-4 ring-blue-500/25 shadow-2xl shadow-blue-950/80 p-2.5 sm:p-3 cursor-default'
                      : isSelected
                      ? 'z-10 min-h-[64px] sm:min-h-[85px] md:min-h-[110px] bg-blue-950/50 border-cyan-400 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-950/50 p-1.5 sm:p-2 cursor-pointer hover:border-cyan-300'
                      : isToday
                      ? 'z-10 min-h-[64px] sm:min-h-[85px] md:min-h-[110px] bg-blue-950/30 border-blue-500/80 shadow-sm p-1.5 sm:p-2 cursor-pointer hover:border-blue-400'
                      : 'z-10 min-h-[64px] sm:min-h-[85px] md:min-h-[110px] bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850 p-1.5 sm:p-2 cursor-pointer'
                  }`}
                >
                  {/* EXPANDED VIEW: When cell is clicked, becomes bigger with animation & full multi-reservation access */}
                  {isExpanded ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                      className={`flex flex-col justify-between h-full ${
                        dayColumn <= 1
                          ? 'md:absolute md:top-0 md:left-0 md:w-[350px] lg:md:w-[380px] md:z-40 md:p-3.5 md:bg-slate-900 md:border-2 md:border-blue-500 md:rounded-2xl md:shadow-2xl md:ring-4 md:ring-blue-500/20'
                          : dayColumn >= 5
                          ? 'md:absolute md:top-0 md:right-0 md:w-[350px] lg:md:w-[380px] md:z-40 md:p-3.5 md:bg-slate-900 md:border-2 md:border-blue-500 md:rounded-2xl md:shadow-2xl md:ring-4 md:ring-blue-500/20'
                          : 'md:absolute md:top-0 md:left-1/2 md:-translate-x-1/2 md:w-[350px] lg:md:w-[380px] md:z-40 md:p-3.5 md:bg-slate-900 md:border-2 md:border-blue-500 md:rounded-2xl md:shadow-2xl md:ring-4 md:ring-blue-500/20'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Expanded Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            {dayNumber}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-white capitalize truncate">
                              {formatSelectedDateHuman(dateStr).split(' ')[0]} {dayNumber}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {dayBookings.length === 0
                                ? 'Aucune réservation'
                                : `${dayBookings.length} réservation${dayBookings.length > 1 ? 's' : ''}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {onOpenBookingWizard && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenBookingWizard(undefined, dateStr);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title="Ajouter une réservation pour ce jour"
                            >
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">Ajouter</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDateStr(null);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
                            title="Réduire la cellule"
                            aria-label="Réduire la cellule"
                          >
                            <Minimize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Content: Full Accessible Multiple Reservations List */}
                      <div className="flex-1 py-2 min-h-0">
                        {dayBookings.length === 0 ? (
                          <div className="py-6 text-center space-y-2">
                            <Car className="w-7 h-7 text-slate-600 mx-auto" />
                            <p className="text-slate-300 text-xs font-bold">Aucune réservation pour ce jour</p>
                            <p className="text-slate-500 text-[10px]">Tous les véhicules sont disponibles</p>
                            {onOpenBookingWizard && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenBookingWizard(undefined, dateStr);
                                }}
                                className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Créer une réservation</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="max-h-[220px] sm:max-h-[250px] overflow-y-auto space-y-2 pr-1">
                            {dayBookings.map((bk) => {
                              const vehicle = vehicles.find((v) => v.id === bk.vehicleId);
                              return (
                                <div
                                  key={bk.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBookingClick(bk);
                                  }}
                                  className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition flex flex-col gap-2 cursor-pointer shadow-xs"
                                >
                                  <div className="flex items-start justify-between gap-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                                        <Car className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <h4 className="text-xs font-bold text-white truncate">
                                            {bk.vehicleName || 'Véhicule'}
                                          </h4>
                                          {vehicle?.plate && (
                                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900 text-cyan-300 font-bold border border-slate-700">
                                              {vehicle.plate}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-300 truncate flex items-center gap-1">
                                          <User className="w-2.5 h-2.5 text-slate-400" />
                                          <span className="truncate">{bk.clientName}</span>
                                        </p>
                                      </div>
                                    </div>

                                    {/* Color Coded Status Badge */}
                                    <span
                                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${getStatusBadge(
                                        bk.status
                                      )}`}
                                    >
                                      {getStatusLabel(bk.status)}
                                    </span>
                                  </div>

                                  {/* Quick Actions inside expanded cell */}
                                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-700/60">
                                    {bk.status === 'CONFIRMED' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartCheckIn(bk);
                                        }}
                                        className="flex-1 py-1 px-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                                      >
                                        <Key className="w-3 h-3" />
                                        <span>Check-in</span>
                                      </button>
                                    )}

                                    {bk.status === 'IN_PROGRESS' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartCheckOut(bk);
                                        }}
                                        className="flex-1 py-1 px-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Check-out</span>
                                      </button>
                                    )}

                                    {onOpenInvoice && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOpenInvoice(bk.id);
                                        }}
                                        className="py-1 px-2 rounded-md bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-medium transition flex items-center gap-1 cursor-pointer"
                                        title="Voir la facture"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>Facture</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookingClick(bk);
                                      }}
                                      className="py-1 px-2 rounded-md bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-medium transition flex items-center gap-1 cursor-pointer"
                                      title="Voir les détails"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Détails</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Expanded Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                        <span>{dayBookings.length} résa{dayBookings.length > 1 ? 's' : ''} au total</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDateStr(null);
                          }}
                          className="text-slate-400 hover:text-white font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Minimize2 className="w-3 h-3" />
                          <span>Réduire</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* COMPACT VIEW (Unexpanded): Prevents cell saturation */
                    <div className="flex flex-col justify-between h-full">
                      {/* Day Header with clean badge and expand prompt */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[11px] sm:text-xs font-black min-w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors ${
                            isToday
                              ? 'bg-blue-600 text-white shadow-sm'
                              : isSelected
                              ? 'text-cyan-300 font-extrabold'
                              : 'text-slate-300'
                          }`}
                        >
                          {dayNumber}
                        </span>

                        <div className="flex items-center gap-1">
                          {dayBookings.length > 0 ? (
                            <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80 flex-shrink-0">
                              {dayBookings.length}
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded flex items-center justify-center text-slate-600 group-hover:text-cyan-400 transition opacity-0 group-hover:opacity-100">
                              <Maximize2 className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Empty Day Indicator */}
                      {dayBookings.length === 0 && (
                        <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-70 transition-opacity py-1">
                          <span className="text-[9px] font-semibold text-blue-400 flex items-center gap-0.5">
                            <Plus className="w-2.5 h-2.5" />
                            <span className="hidden sm:inline">Réserver</span>
                          </span>
                        </div>
                      )}

                      {/* MOBILE VIEW (< md): Clean Dots Display (Prevents text squishing & clipping) */}
                      <div className="block md:hidden mt-auto pt-1">
                        {dayBookings.length > 0 ? (
                          <div className="flex items-center justify-center flex-wrap gap-1 py-0.5">
                            {dayBookings.slice(0, 3).map((bk) => (
                              <span
                                key={bk.id}
                                className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(bk.status)} shadow-xs`}
                                title={`${bk.vehicleName} (${getStatusLabel(bk.status)})`}
                              />
                            ))}
                            {dayBookings.length > 3 && (
                              <span className="text-[9px] font-bold text-slate-400">
                                +{dayBookings.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-2" />
                        )}
                      </div>

                      {/* DESKTOP VIEW (>= md): Unsaturated Compact Chips with Click-to-Expand Badge */}
                      <div className="hidden md:block space-y-1 mt-1 flex-1 overflow-hidden">
                        {dayBookings.slice(0, 2).map((bk) => (
                          <div
                            key={bk.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingClick(bk);
                            }}
                            className={`text-[10px] font-bold px-1.5 py-1 rounded-md border truncate flex items-center gap-1 cursor-pointer transition ${getStatusBadge(
                              bk.status
                            )} hover:brightness-125 shadow-xs`}
                            title={`${bk.vehicleName} (${bk.clientName}) - ${getStatusLabel(bk.status)}`}
                          >
                            <Car className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{bk.vehicleName || 'Véhicule'}</span>
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-[9px] text-blue-300 font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-between hover:bg-blue-500/20 transition">
                            <span>+{dayBookings.length - 2} autre{dayBookings.length - 2 > 1 ? 's' : ''}</span>
                            <span className="text-[8px] text-cyan-400 font-medium flex items-center gap-0.5">
                              <span>Agrandir</span>
                              <Maximize2 className="w-2 h-2" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Calendar Color Code Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Code Couleur :</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
                <span className="text-slate-200">Réservation faite : <strong className="text-blue-400 font-bold">Bleu</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-500/50" />
                <span className="text-slate-200">Check-in validé : <strong className="text-emerald-400 font-bold">Vert</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-500/50" />
                <span className="text-slate-200">Check-out / Fin contrat : <strong className="text-amber-400 font-bold">Jaune</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
                <span className="text-slate-200">Annulée : <strong className="text-rose-400 font-bold">Rouge</strong></span>
              </div>
            </div>
          </div>

          {/* DAY PLANNING PANEL: Rich touch-friendly inspection for the selected day */}
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/30 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white capitalize">
                    {formatSelectedDateHuman(selectedDateStr)}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedDayBookings.length === 0
                      ? 'Aucune réservation sur cette journée'
                      : `${selectedDayBookings.length} réservation${selectedDayBookings.length > 1 ? 's' : ''} programmée${selectedDayBookings.length > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              {onOpenBookingWizard && (
                <button
                  type="button"
                  onClick={() => onOpenBookingWizard(undefined, selectedDateStr)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Réserver pour ce jour</span>
                </button>
              )}
            </div>

            {selectedDayBookings.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-slate-400 text-xs space-y-3">
                <Car className="w-8 h-8 text-slate-600 mx-auto" />
                <div>
                  <p className="text-slate-300 font-bold">Aucun véhicule loué ou réservé pour le {selectedDateStr}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Tous les véhicules disponibles peuvent être réservés à cette date.</p>
                </div>
                {onOpenBookingWizard && (
                  <button
                    type="button"
                    onClick={() => onOpenBookingWizard(undefined, selectedDateStr)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer une réservation pour le {selectedDateStr}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDayBookings.map((bk) => {
                  const vehicle = vehicles.find((v) => v.id === bk.vehicleId);
                  const isDepartureDay = bk.startDate === selectedDateStr;
                  const isReturnDay = bk.endDate === selectedDateStr;

                  return (
                    <div
                      key={bk.id}
                      onClick={() => handleBookingClick(bk)}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-sm cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {vehicle?.images?.[0] ? (
                            <img
                              src={vehicle.images[0]}
                              alt={bk.vehicleName}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                              <Car className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs sm:text-sm font-black text-white">
                                {bk.vehicleName || 'Véhicule'}
                              </h3>
                              {vehicle?.plate && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                                  {vehicle.plate}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                              <User className="w-3 h-3 text-blue-400" />
                              <span className="font-semibold">{bk.clientName || 'Client'}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>Du {bk.startDate} au {bk.endDate}</span>
                              <span className="font-bold text-slate-300">({bk.durationDays || 1} j)</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(
                              bk.status
                            )}`}
                          >
                            {bk.status === 'CONFIRMED'
                              ? 'Confirmée'
                              : bk.status === 'IN_PROGRESS'
                              ? 'En cours'
                              : bk.status === 'COMPLETED'
                              ? 'Terminée'
                              : bk.status}
                          </span>
                          {isDepartureDay && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Départ aujourd'hui
                            </span>
                          )}
                          {isReturnDay && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              Retour prévu
                            </span>
                          )}
                          <span className="text-xs font-black text-emerald-400 mt-1">
                            {bk.totalAmount} DT
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Buttons for desk agent */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                        {bk.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCheckIn(bk);
                            }}
                            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Départ / Clés (Check-In)</span>
                          </button>
                        )}

                        {bk.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCheckOut(bk);
                            }}
                            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Retour Véhicule (Check-Out)</span>
                          </button>
                        )}

                        {bk.status === 'CANCELLED' && (
                          <div className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5">
                            <span>Annulée • Véhicule libéré (Disponible)</span>
                          </div>
                        )}

                        {bk.status === 'COMPLETED' && (
                          <div className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5">
                            <span>Clôturée • Véhicule disponible</span>
                          </div>
                        )}

                        {onOpenInvoice && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInvoice(bk.id);
                            }}
                            className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="Voir la Facture"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span className="hidden sm:inline">Facture</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(bk);
                          }}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Tous les détails"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Détails</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* FULL CONTINUOUS AGENDA VIEW (List View) */
        <div className="space-y-4">
          {/* Agenda search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={agendaSearch}
              onChange={(e) => setAgendaSearch(e.target.value)}
              placeholder="Rechercher par client, immatriculation ou numéro de dossier..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {agendaSearch && (
              <button
                type="button"
                onClick={() => setAgendaSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {agendaBookings.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-slate-400">
              <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-white text-sm">Aucune réservation trouvée pour ce mois</p>
              <p className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou effectuez une autre recherche.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {agendaBookings.map((bk) => {
                const vehicle = vehicles.find((v) => v.id === bk.vehicleId);
                return (
                  <div
                    key={bk.id}
                    onClick={() => handleBookingClick(bk)}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {vehicle?.images?.[0] ? (
                        <img
                          src={vehicle.images[0]}
                          alt={bk.vehicleName}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                          <Car className="w-7 h-7" />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white">{bk.vehicleName}</h3>
                          {vehicle?.plate && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                              {vehicle.plate}
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(
                              bk.status
                            )}`}
                          >
                            {bk.status === 'CONFIRMED'
                              ? 'Réservation faite'
                              : bk.status === 'IN_PROGRESS'
                              ? 'Check-in validé'
                              : bk.status === 'COMPLETED'
                              ? 'Check-out effectué'
                              : bk.status === 'CANCELLED'
                              ? 'Annulée'
                              : bk.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-semibold">{bk.clientName}</span>
                          <span className="text-slate-500">· N° {bk.bookingNumber}</span>
                        </p>

                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Période : {bk.startDate} au {bk.endDate}</span>
                          <span className="font-bold text-slate-300">({bk.durationDays || 1} jours)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Total</span>
                        <span className="text-sm font-black text-emerald-400">{bk.totalAmount} DT</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {bk.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCheckIn(bk);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Départ</span>
                          </button>
                        )}
                        {bk.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCheckOut(bk);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Retour</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(bk);
                          }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                          title="Détails"
                        >
                          <Eye className="w-4 h-4 text-cyan-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Modal when clicked */}
      {activeBookingModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-booking-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl text-slate-100 relative">
            <button
              type="button"
              onClick={() => setActiveBookingModal(null)}
              aria-label="Fermer"
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(
                      activeBookingModal.status
                    )}`}
                  >
                    {getStatusLabel(activeBookingModal.status)}
                  </span>
                </div>
                <h3 id="modal-booking-title" className="text-base sm:text-lg font-black text-white mt-1">
                  {activeBookingModal.vehicleName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Dossier N° {activeBookingModal.bookingNumber}
                </p>
              </div>
            </div>

            {/* Auto Lifecycle status alerts */}
            {activeBookingModal.status === 'CANCELLED' && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-bold">Réservation annulée automatiquement</p>
                  <p className="text-rose-300/80 text-[11px] mt-0.5">
                    La date de début ({activeBookingModal.startDate}) est dépassée sans enregistrement du check-in. Le véhicule a été libéré automatiquement et remis au statut Disponible.
                  </p>
                </div>
              </div>
            )}

            {activeBookingModal.status === 'COMPLETED' && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-bold">Réservation clôturée automatiquement (Check-out)</p>
                  <p className="text-amber-300/80 text-[11px] mt-0.5">
                    La date de fin de contrat ({activeBookingModal.endDate}) est atteinte. Le véhicule a été libéré automatiquement et remis au statut Disponible.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Client :
                </span>
                <span className="font-semibold text-white">{activeBookingModal.clientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Période :
                </span>
                <span className="font-semibold text-white">
                  {activeBookingModal.startDate} → {activeBookingModal.endDate} ({activeBookingModal.durationDays} j)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Montant Total :</span>
                <span className="font-black text-emerald-400 text-sm">
                  {activeBookingModal.totalAmount} DT
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Caution :</span>
                <span className="font-semibold text-slate-200">
                  {activeBookingModal.depositAmount} DT ({activeBookingModal.depositStatus || 'NON_ENCAISSEE'})
                </span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {activeBookingModal.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => handleStartCheckIn(activeBookingModal)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Key className="w-4 h-4" />
                  <span>Faire le Départ (Check-In)</span>
                </button>
              )}

              {activeBookingModal.status === 'IN_PROGRESS' && (
                <button
                  type="button"
                  onClick={() => handleStartCheckOut(activeBookingModal)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Faire le Retour (Check-Out)</span>
                </button>
              )}

              {onOpenInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenInvoice(activeBookingModal.id);
                    setActiveBookingModal(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Facture</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

