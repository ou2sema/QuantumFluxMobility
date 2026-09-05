import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useBooking } from '../../hooks/useBooking';
import { Booking, BookingStatus } from '../../types';
import {
  Calendar,
  Search,
  Filter,
  Key,
  RotateCcw,
  FileText,
  Clock,
  Phone,
  Car,
  User,
  Plus,
  AlertCircle
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';

interface BookingsViewProps {
  onOpenBookingWizard: () => void;
  onOpenInvoice: (bookingId: string) => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  onOpenBookingWizard,
  onOpenInvoice,
}) => {
  const { bookings } = useApp();
  const { startCheckInFlow, startCheckOutFlow } = useBooking();

  const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | BookingStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBookings = bookings.filter(b => {
    if (activeStatusTab !== 'ALL' && b.status !== activeStatusTab) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        b.bookingNumber.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.vehiclePlate.toLowerCase().includes(q) ||
        b.vehicleName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 pb-32 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Planning & Réservations
          </span>
          <h1 className="text-2xl font-black text-white">Gestion des Réservations</h1>
        </div>

        <TactileButton
          variant="primary"
          icon={Plus}
          onClick={onOpenBookingWizard}
          className="whitespace-nowrap flex-shrink-0 self-start sm:self-auto"
        >
          Nouvelle Réservation
        </TactileButton>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher par n° de résa, client, immatriculation..."
          className="w-full min-h-[56px] pl-12 pr-4 rounded-2xl bg-[#131B2E] border-2 border-slate-700 text-white placeholder-slate-400 font-semibold text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
        />
      </div>

      {/* Status Filter Tabs (Horizontal Scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-1 select-none">
        {[
          { id: 'ALL', label: 'Toutes', count: bookings.length },
          { id: 'CONFIRMED', label: 'À Remettre', count: bookings.filter(b => b.status === 'CONFIRMED').length },
          { id: 'IN_PROGRESS', label: 'En Cours', count: bookings.filter(b => b.status === 'IN_PROGRESS').length },
          { id: 'COMPLETED', label: 'Clôturées', count: bookings.filter(b => b.status === 'COMPLETED').length },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveStatusTab(tab.id as any)}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 active:scale-95 ${
              activeStatusTab === tab.id
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                : 'bg-[#131B2E] text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 font-mono text-[10px]">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List Cards */}
      {filteredBookings.length === 0 ? (
        <div className="p-8 rounded-3xl bg-[#10172A] border border-slate-800 text-center flex flex-col items-center gap-2">
          <Calendar className="w-10 h-10 text-slate-600" />
          <p className="text-sm font-bold text-slate-400">Aucune réservation trouvée dans cette catégorie.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              className="tactile-card bg-[#10172A] rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl flex flex-col gap-3"
            >
              {/* Header card info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                      {booking.bookingNumber}
                    </span>
                    <StatusBadge status={booking.status} size="small" />
                    {booking.paymentStatus === 'PENDING' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Espèces à encaisser
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-1">
                    {booking.vehicleName}
                  </h3>
                </div>

                <span className="text-base font-black font-mono text-emerald-400">
                  {booking.totalAmount.toFixed(2)} DT
                </span>
              </div>

              {/* Vehicle & Client specs row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#0A0E1A] p-3 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Immatriculation & Dates</span>
                  <p className="font-mono font-bold text-cyan-400">{booking.vehiclePlate}</p>
                  <p className="text-slate-300 mt-0.5">
                    {booking.startDate} au {booking.endDate} ({booking.durationDays}j)
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Locataire</span>
                  <p className="font-bold text-white">{booking.clientName}</p>
                  <p className="text-slate-400 mt-0.5">{booking.clientPhone}</p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-1">
                {booking.status === 'CONFIRMED' && (
                  <TactileButton
                    variant="success"
                    size="normal"
                    className="flex-1 font-black"
                    icon={Key}
                    onClick={() => startCheckInFlow(booking)}
                  >
                    Faire Check-in
                  </TactileButton>
                )}

                {booking.status === 'IN_PROGRESS' && (
                  <TactileButton
                    variant="primary"
                    size="normal"
                    className="flex-1 font-black"
                    icon={RotateCcw}
                    onClick={() => startCheckOutFlow(booking)}
                  >
                    Faire Check-out
                  </TactileButton>
                )}

                <button
                  type="button"
                  onClick={() => onOpenInvoice(booking.id)}
                  className="min-h-[56px] px-4 rounded-2xl bg-[#1A2338] border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-transform"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Contrat & Facture</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
