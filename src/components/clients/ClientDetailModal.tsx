import React from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Calendar,
  AlertTriangle,
  X,
  CreditCard,
  Plus
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';

interface ClientDetailModalProps {
  client: Client;
  onClose: () => void;
  onStartBooking?: (clientId: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  onClose,
  onStartBooking,
}) => {
  const { bookings } = useApp();

  const clientBookings = bookings.filter(b => b.clientId === client.id);
  const isLicenseExpiringSoon = client.licenseExpiryDate.startsWith('2026');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="pt-safe px-5 py-4 bg-[#131E38] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center">
              {client.firstName[0]}
              {client.lastName[0]}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {client.firstName} {client.lastName}
              </h2>
              <p className="text-xs text-slate-400">Client Enregistré</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* License Alert if expiring */}
          {isLicenseExpiringSoon && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-extrabold">Alerte Permis de Conduire !</p>
                <p className="text-[11px] mt-0.5">Le permis de ce client arrive à expiration le {client.licenseExpiryDate}. Demander le renouvellement.</p>
              </div>
            </div>
          )}

          {/* Contact Details Card */}
          <div className="bg-[#131B2E] p-4 rounded-2xl border border-slate-800 flex flex-col gap-2.5 text-xs">
            <span className="text-[10px] font-bold text-indigo-400 uppercase">Coordonnées</span>
            <div className="flex items-center gap-2 text-white">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-bold">{client.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{client.address}, {client.city}</span>
            </div>
          </div>

          {/* Driving License Specs */}
          <div className="bg-[#131B2E] p-4 rounded-2xl border border-slate-800 flex flex-col gap-2.5 text-xs">
            <span className="text-[10px] font-bold text-indigo-400 uppercase">Permis & Documents</span>
            <div className="grid grid-cols-2 gap-2 bg-[#0A0E1A] p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400">N° Permis</span>
                <p className="font-mono font-bold text-cyan-400">{client.licenseNumber}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Validité jusqu'au</span>
                <p className="font-mono font-bold text-white">{client.licenseExpiryDate}</p>
              </div>
            </div>
          </div>

          {/* Rental History */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Historique des Locations ({clientBookings.length})
            </span>

            {clientBookings.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 text-center">Aucune réservation pour ce client.</p>
            ) : (
              clientBookings.map(bk => (
                <div
                  key={bk.id}
                  className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">{bk.vehiclePlate}</span>
                      <span className="font-bold text-white">{bk.vehicleName}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      {bk.startDate} au {bk.endDate} ({bk.bookingNumber})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400">{bk.totalAmount.toFixed(2)} DT</span>
                    <div className="mt-1">
                      <StatusBadge status={bk.status} size="small" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pb-safe px-5 py-4 bg-[#131E38] border-t border-slate-800 flex items-center gap-3">
          <TactileButton variant="outline" className="flex-1" onClick={onClose}>
            Fermer
          </TactileButton>

          {onStartBooking && (
            <TactileButton
              variant="primary"
              className="flex-1 font-black"
              icon={Plus}
              onClick={() => {
                onClose();
                onStartBooking(client.id);
              }}
            >
              Nouvelle Location
            </TactileButton>
          )}
        </div>
      </div>
    </div>
  );
};
