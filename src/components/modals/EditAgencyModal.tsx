import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { Agency } from '../../types';
import { TactileButton } from '../ui/TactileButton';
import {
  Building2,
  X,
  Save,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Plus
} from 'lucide-react';

interface EditAgencyModalProps {
  onClose: () => void;
}

export const EditAgencyModal: React.FC<EditAgencyModalProps> = ({ onClose }) => {
  const { currentAgency, agencies, setCurrentAgency, updateAgency } = useApp();
  const { isManagerOrAdmin } = useAuth();

  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(currentAgency.id);
  const activeAgency = agencies.find(a => a.id === selectedAgencyId) || currentAgency;

  const [name, setName] = useState(activeAgency.name);
  const [city, setCity] = useState(activeAgency.city);
  const [address, setAddress] = useState(activeAgency.address);
  const [phone, setPhone] = useState(activeAgency.phone);
  const [email, setEmail] = useState(activeAgency.email);
  const [openHours, setOpenHours] = useState(activeAgency.openHours);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // When switching agency tab
  const handleSelectAgency = (ag: Agency) => {
    setSelectedAgencyId(ag.id);
    setName(ag.name);
    setCity(ag.city);
    setAddress(ag.address);
    setPhone(ag.phone);
    setEmail(ag.email);
    setOpenHours(ag.openHours);
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Agency = {
      ...activeAgency,
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      openHours: openHours.trim(),
    };

    updateAgency(updated);
    setCurrentAgency(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full max-w-xl bg-[#0D1224] border border-gray-800 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-[#151B30] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                Configuration Administrateur
              </span>
              <h3 className="text-base font-black text-white">
                Modifier l'Agence / Titre Établissement
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agency Selector Switcher */}
        <div className="p-3 bg-[#0A0E1A] border-b border-gray-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono text-gray-400 uppercase font-bold pl-1 whitespace-nowrap">
            Agences :
          </span>
          {agencies.map(ag => (
            <button
              key={ag.id}
              type="button"
              onClick={() => handleSelectAgency(ag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
                selectedAgencyId === ag.id
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-[#151B30] text-gray-400 border-gray-800 hover:text-white'
              }`}
            >
              {ag.city} • {ag.name.replace('QuantumFlux ', '')}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Modifications enregistrées avec succès ! Titre et coordonnées actualisés.</span>
            </div>
          )}

          {/* Agency Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Nom complet de l'établissement / Titre d'agence</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: QUANTUMFLUX PARIS ORLY AIRPORT"
              className="min-h-[46px] px-3.5 rounded-xl bg-[#151B30] border border-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white text-sm font-bold placeholder-gray-600 outline-none"
            />
            <span className="text-[11px] text-gray-400">
              Ce titre s'affiche dans l'en-tête, sur les contrats, factures et sur le portail client.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* City */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase text-gray-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ville / Pôle</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ex: Orly, Roissy, Lyon..."
                className="min-h-[46px] px-3.5 rounded-xl bg-[#151B30] border border-gray-800 focus:border-cyan-400 text-white text-sm font-bold placeholder-gray-600 outline-none"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase text-gray-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Téléphone de contact</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex: +33 1 49 75 00 00"
                className="min-h-[46px] px-3.5 rounded-xl bg-[#151B30] border border-gray-800 focus:border-cyan-400 text-white text-sm font-mono font-bold placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-bold uppercase text-gray-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Adresse postale complète</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ex: Terminal 4 - Niveau Arrivées, 94390 Orly"
              className="min-h-[46px] px-3.5 rounded-xl bg-[#151B30] border border-gray-800 focus:border-cyan-400 text-white text-sm font-bold placeholder-gray-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase text-gray-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Email de l'agence</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: orly@quantumflux.io"
                className="min-h-[46px] px-3.5 rounded-xl bg-[#151B30] border border-gray-800 focus:border-cyan-400 text-white text-sm font-mono font-bold placeholder-gray-600 outline-none"
              />
            </div>

            {/* Hours */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold uppercase text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Horaires d'ouverture</span>
              </label>
              <input
                type="text"
                value={openHours}
                onChange={e => setOpenHours(e.target.value)}
                placeholder="Ex: 06:00 - 23:30 (7j/7)"
                className="min-h-[46px] px-3.5 rounded-xl bg-[#151B30] border border-gray-800 focus:border-cyan-400 text-white text-sm font-bold placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          <div className="mt-2 p-3 rounded-xl bg-[#151B30]/60 border border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>Définir comme agence active de travail</span>
            <button
              type="button"
              onClick={() => setCurrentAgency(activeAgency)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                currentAgency.id === activeAgency.id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-white'
              }`}
            >
              {currentAgency.id === activeAgency.id ? '✓ Agence Active' : 'Sélectionner cette agence'}
            </button>
          </div>

          {/* Footer Submit */}
          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-3">
            <TactileButton variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </TactileButton>
            <TactileButton variant="primary" type="submit" className="flex-1" icon={Save}>
              Enregistrer les modifications
            </TactileButton>
          </div>
        </form>
      </div>
    </div>
  );
};
