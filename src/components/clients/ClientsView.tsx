import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { ClientDetailModal } from './ClientDetailModal';

interface ClientsViewProps {
  onOpenNewClientModal?: () => void;
  onStartBookingWithClient?: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenNewClientModal,
  onStartBookingWithClient,
}) => {
  const { clients } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.licenseNumber.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 pb-32 flex flex-col gap-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Fichier Clients & Permis
          </span>
          <h1 className="text-2xl font-black text-white">Gestion des Clients</h1>
        </div>

        <TactileButton
          variant="primary"
          icon={UserPlus}
          onClick={onOpenNewClientModal}
        >
          Nouveau Client
        </TactileButton>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom, téléphone, email ou permis..."
          className="w-full min-h-[56px] pl-12 pr-4 rounded-2xl bg-[#131B2E] border-2 border-slate-700 text-white placeholder-slate-400 font-semibold text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
        />
      </div>

      {/* Clients List */}
      <div className="flex flex-col gap-3">
        {filteredClients.map(client => {
          const isExpiring = client.licenseExpiryDate.startsWith('2026');

          return (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="tactile-card bg-[#10172A] rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/40"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center flex-shrink-0">
                  {client.firstName[0]}
                  {client.lastName[0]}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-white text-base">
                      {client.firstName} {client.lastName}
                    </h3>
                    {isExpiring && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Permis expire bientôt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {client.phone} • <span className="font-mono text-cyan-400">{client.licenseNumber}</span>
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onStartBooking={onStartBookingWithClient}
        />
      )}
    </div>
  );
};
