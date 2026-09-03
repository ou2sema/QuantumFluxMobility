import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vehicle, VehicleStatus } from '../../types';
import {
  Car,
  Search,
  Filter,
  Fuel,
  Gauge,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Sparkles,
  Edit,
  Key,
  ShieldAlert
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';
import { VehicleDetailModal } from './VehicleDetailModal';
import { AddEditVehicleModal } from './AddEditVehicleModal';

interface FleetViewProps {
  onStartBooking: (vehicleId: string) => void;
}

export const FleetView: React.FC<FleetViewProps> = ({ onStartBooking }) => {
  const { vehicles, updateVehicleStatus } = useApp();

  const [activeFilter, setActiveFilter] = useState<'ALL' | VehicleStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter(v => {
    if (activeFilter !== 'ALL' && v.status !== activeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        v.plate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleQuickStatusChange = (e: React.MouseEvent, vehicleId: string, newStatus: VehicleStatus) => {
    e.stopPropagation();
    updateVehicleStatus(vehicleId, newStatus);
  };

  const handleEditClick = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation();
    setVehicleToEdit(vehicle);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-32 flex flex-col gap-5 select-none">
      {/* Header with Add Vehicle Hero Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">
              Parc Automobile Agence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            Gestion de la <span className="text-cyan-400 font-light">Flotte</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[52px] px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2.5 shadow-lg shadow-cyan-950/50 active:scale-95 transition-all cursor-pointer border border-cyan-400/30"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Ajouter un Véhicule</span>
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher par Immatriculation (ex: GG-842), Marque, Modèle ou Catégorie..."
          className="w-full min-h-[52px] pl-11 pr-4 rounded-xl bg-[#151B30] border border-gray-800 text-white placeholder-gray-500 font-semibold text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 select-none">
        {[
          { id: 'ALL', label: 'Tous', count: vehicles.length },
          { id: 'AVAILABLE', label: 'Disponibles', count: vehicles.filter(v => v.status === 'AVAILABLE').length, color: 'text-green-400' },
          { id: 'RENTED', label: 'Déjà Loués', count: vehicles.filter(v => v.status === 'RENTED').length, color: 'text-blue-400' },
          { id: 'MAINTENANCE', label: 'En Maintenance', count: vehicles.filter(v => v.status === 'MAINTENANCE').length, color: 'text-orange-400' },
          { id: 'UNAVAILABLE', label: 'Indisponibles', count: vehicles.filter(v => v.status === 'UNAVAILABLE').length, color: 'text-rose-400' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id as any)}
            className={`min-h-[46px] px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 active:scale-95 cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-black'
                : 'bg-[#151B30] text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full bg-black/40 font-mono text-[10px] ${tab.color || 'text-white'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="p-10 rounded-2xl bg-[#151B30] border border-gray-800 text-center flex flex-col items-center justify-center gap-3">
          <Car className="w-12 h-12 text-gray-600 mb-1" />
          <h3 className="text-base font-bold text-white">Aucun véhicule trouvé</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Aucun véhicule ne correspond aux filtres actuels. Vous pouvez ajouter un nouveau véhicule en un clic.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[48px] px-6 rounded-xl bg-cyan-600 text-white font-bold uppercase text-xs tracking-wider flex items-center gap-2 mt-2 cursor-pointer shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Véhicule
          </button>
        </div>
      )}

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVehicles.map(vehicle => (
          <div
            key={vehicle.id}
            onClick={() => setSelectedVehicle(vehicle)}
            className="bg-[#151B30] rounded-2xl p-4 sm:p-5 border border-gray-800 shadow-xl flex flex-col justify-between gap-4 cursor-pointer hover:border-cyan-500/50 transition-all hover:bg-[#182038] group"
          >
            {/* Top row: Photo, Brand, Plate & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/40 border border-gray-700 flex-shrink-0 relative">
                  <img
                    src={vehicle.images[0]}
                    alt={vehicle.model}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-gray-300">
                    {vehicle.year}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#0A0E1A] px-2 py-0.5 rounded text-cyan-400 border border-gray-800">
                      {vehicle.plate}
                    </span>
                    <span className="text-[11px] font-mono text-gray-500 uppercase">
                      {vehicle.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mt-1 group-hover:text-cyan-300 transition-colors">
                    {vehicle.brand} {vehicle.model}
                  </h3>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {vehicle.fuelType} • {vehicle.transmission} • {vehicle.seats} pl.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={vehicle.status} size="small" />
                <button
                  type="button"
                  onClick={(e) => handleEditClick(e, vehicle)}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer border border-gray-700"
                  title="Modifier le véhicule"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Éditer</span>
                </button>
              </div>
            </div>

            {/* Quick-Action Status Switcher Bar (Immediate 1-tap change) */}
            <div className="bg-[#0A0E1A] p-2.5 rounded-xl border border-gray-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase font-bold px-1">
                <span>Changement rapide de statut :</span>
                <span className="text-cyan-400 font-bold">1-tap</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleQuickStatusChange(e, vehicle.id, 'AVAILABLE')}
                  className={`min-h-[38px] px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer ${
                    vehicle.status === 'AVAILABLE'
                      ? 'bg-green-600 text-white shadow-sm font-black'
                      : 'bg-[#151B30] text-gray-400 hover:text-green-300 hover:bg-gray-800'
                  }`}
                >
                  Dispo
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuickStatusChange(e, vehicle.id, 'RENTED')}
                  className={`min-h-[38px] px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer ${
                    vehicle.status === 'RENTED'
                      ? 'bg-blue-600 text-white shadow-sm font-black'
                      : 'bg-[#151B30] text-gray-400 hover:text-blue-300 hover:bg-gray-800'
                  }`}
                >
                  Loué
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuickStatusChange(e, vehicle.id, 'MAINTENANCE')}
                  className={`min-h-[38px] px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer ${
                    vehicle.status === 'MAINTENANCE'
                      ? 'bg-orange-500 text-white shadow-sm font-black'
                      : 'bg-[#151B30] text-gray-400 hover:text-orange-300 hover:bg-gray-800'
                  }`}
                >
                  Maint.
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuickStatusChange(e, vehicle.id, 'UNAVAILABLE')}
                  className={`min-h-[38px] px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer ${
                    vehicle.status === 'UNAVAILABLE'
                      ? 'bg-rose-600 text-white shadow-sm font-black'
                      : 'bg-[#151B30] text-gray-400 hover:text-rose-300 hover:bg-gray-800'
                  }`}
                >
                  Hors S.
                </button>
              </div>
            </div>

            {/* Bottom info bar */}
            <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1 text-gray-300">
                <Gauge className="w-3.5 h-3.5 text-gray-500" />
                <span>{vehicle.mileage.toLocaleString()} km</span>
              </div>

              <div className="flex items-center gap-1 text-cyan-400">
                <Fuel className="w-3.5 h-3.5" />
                <span>{vehicle.currentFuelLevel}%</span>
              </div>

              <div className="font-bold text-emerald-400 text-sm">
                {vehicle.dailyRate.toFixed(2)} DT<span className="text-[10px] text-gray-500 font-normal">/j</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedVehicle && (
        <VehicleDetailModal
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onStartBooking={onStartBooking}
          onEditVehicle={(veh) => {
            setSelectedVehicle(null);
            setVehicleToEdit(veh);
          }}
        />
      )}

      {/* Add / Edit Vehicle Modal */}
      {(isAddModalOpen || vehicleToEdit) && (
        <AddEditVehicleModal
          vehicleToEdit={vehicleToEdit}
          onClose={() => {
            setIsAddModalOpen(false);
            setVehicleToEdit(null);
          }}
          onSuccess={(saved) => {
            setIsAddModalOpen(false);
            setVehicleToEdit(null);
          }}
        />
      )}
    </div>
  );
};

