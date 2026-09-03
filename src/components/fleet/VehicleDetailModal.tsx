import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vehicle, VehicleStatus } from '../../types';
import {
  Car,
  Check,
  ChevronRight,
  Gauge,
  Fuel,
  Wrench,
  Calendar,
  AlertTriangle,
  X,
  Plus,
  ShieldCheck,
  Zap,
  Edit,
  Camera,
  Eye,
  ZoomIn,
  CheckCircle2
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';
import { DamageVehicleDiagram } from '../ui/DamageVehicleDiagram';

interface VehicleDetailModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onStartBooking?: (vehicleId: string) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
}

const PHOTO_LABELS: Record<string, { label: string; desc: string }> = {
  front: { label: 'Face Avant', desc: 'Calandre, optiques & plaque' },
  rear: { label: 'Face Arrière', desc: 'Coffre, feux & pare-chocs' },
  left: { label: 'Profil Gauche', desc: 'Côté conducteur, ailes & rétroviseur' },
  right: { label: 'Profil Droit', desc: 'Côté passager & trappe carburant' },
  interior: { label: 'Habitacle & Sièges', desc: 'Sellerie, volant & console centrale' },
  dashboard: { label: 'Tableau de Bord', desc: 'Compteur kilométrique & jauge' },
};

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  onStartBooking,
  onEditVehicle,
}) => {
  const { updateVehicleStatus, addVehicleDamage, bookings, checkIns, checkOuts, maintenances, setActiveTab } = useApp();
  const [activeTab, setActiveModalTab] = useState<'SPECS' | 'PHOTOS' | 'DAMAGES' | 'MAINTENANCE' | 'HISTORY'>('SPECS');
  const [selectedPhotoKey, setSelectedPhotoKey] = useState<string>('front');
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  const vehicleBookings = bookings.filter(b => b.vehicleId === vehicle.id);
  const vehicleMaintenances = maintenances.filter(m => m.vehicleId === vehicle.id);
  const latestCheckIn = checkIns.find(ci => ci.vehicleId === vehicle.id);
  const latestCheckOut = checkOuts.find(co => co.vehicleId === vehicle.id);

  const fallbackPhotos = {
    front: vehicle.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    rear: vehicle.images[1] || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80',
    left: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    right: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    interior: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    dashboard: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80',
  };

  const activePhotos = latestCheckIn?.photos || fallbackPhotos;
  const currentPhotoUrl = (activePhotos as any)[selectedPhotoKey] || fallbackPhotos.front;

  const handleStatusChange = (newStatus: VehicleStatus) => {
    updateVehicleStatus(vehicle.id, newStatus);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0D1224] border border-gray-800 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 bg-[#151B30] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-[#0A0E1A] px-2 py-0.5 rounded text-cyan-400 border border-gray-800">
                  {vehicle.plate}
                </span>
                <StatusBadge status={vehicle.status} size="small" />
              </div>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditVehicle && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditVehicle(vehicle);
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all border border-gray-700 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modifier</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#0A0E1A] p-1.5 border-b border-gray-800 gap-1 overflow-x-auto">
          {[
            { id: 'SPECS', label: 'Caractéristiques' },
            { id: 'DAMAGES', label: `Dommages (${vehicle.damages.length})` },
            { id: 'MAINTENANCE', label: 'Maintenance' },
            { id: 'HISTORY', label: `Locations (${vehicleBookings.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveModalTab(tab.id as any)}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 text-center cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {activeTab === 'SPECS' && (
            <div className="flex flex-col gap-4">
              {/* Photo hero */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-800 h-48 bg-black/50">
                <img
                  src={vehicle.images[0]}
                  alt={vehicle.model}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-cyan-400 border border-gray-800">
                  VIN : {vehicle.vin}
                </div>
              </div>

              {/* Status Switcher Bar */}
              <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Modifier le Statut Immédiat
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono font-bold">Actuel : {vehicle.status}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'AVAILABLE', label: 'Disponible', activeClass: 'bg-green-600 text-white border-green-400 font-black' },
                    { id: 'RENTED', label: 'Déjà Loué', activeClass: 'bg-blue-600 text-white border-blue-400 font-black' },
                    { id: 'MAINTENANCE', label: 'Maintenance', activeClass: 'bg-orange-500 text-white border-orange-400 font-black' },
                    { id: 'UNAVAILABLE', label: 'Indisponible', activeClass: 'bg-rose-600 text-white border-rose-400 font-black' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStatusChange(st.id as VehicleStatus)}
                      className={`min-h-[46px] rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                        vehicle.status === st.id
                          ? `${st.activeClass} shadow-md`
                          : 'bg-[#0A0E1A] text-gray-300 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800 text-xs">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Compteur</span>
                  <p className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {vehicle.mileage.toLocaleString()} km
                  </p>
                </div>

                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800 text-xs">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Carburant / Énergie</span>
                  <p className="text-sm font-extrabold text-cyan-400 mt-0.5">
                    {vehicle.fuelType} ({vehicle.currentFuelLevel}%)
                  </p>
                </div>

                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800 text-xs">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Tarif Journalier</span>
                  <p className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">
                    {vehicle.dailyRate.toFixed(2)} DT / jour
                  </p>
                </div>

                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800 text-xs">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Boîte & Places</span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {vehicle.transmission} • {vehicle.seats} places
                  </p>
                </div>

                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800 text-xs">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Caution requise</span>
                  <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                    {vehicle.depositAmount} DT
                  </p>
                </div>

                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800 text-xs">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Excédent KM</span>
                  <p className="text-xs font-bold text-gray-300 font-mono mt-0.5">
                    {vehicle.excessKmRate} DT / km
                  </p>
                </div>
              </div>

              {/* Equipment list */}
              <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase font-mono">Équipements de série</span>
                <div className="flex flex-wrap gap-1.5">
                  {vehicle.features.map(feat => (
                    <span
                      key={feat}
                      className="px-2.5 py-1 rounded-lg bg-[#0A0E1A] border border-gray-800 text-xs text-gray-300 font-medium"
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DAMAGES' && (
            <DamageVehicleDiagram
              damages={vehicle.damages}
              onAddDamage={dmg => addVehicleDamage(vehicle.id, dmg)}
            />
          )}

          {activeTab === 'MAINTENANCE' && (
            <div className="flex flex-col gap-3">
              <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-400 uppercase font-mono">
                    Prochaine Révision Programmée
                  </span>
                  <p className="text-sm font-extrabold text-white mt-0.5">
                    Révision périodique des {vehicle.nextMaintenanceMileage || 25000} km
                  </p>
                  <p className="text-xs text-gray-400">
                    Reste : ~{Math.max(0, (vehicle.nextMaintenanceMileage || 25000) - vehicle.mileage)} km
                  </p>
                </div>
                <Wrench className="w-8 h-8 text-orange-400" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase font-mono">
                  Historique d'entretien ({vehicleMaintenances.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setActiveTab('maintenance');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Ouvrir dans l'Atelier</span>
                </button>
              </div>

              {vehicleMaintenances.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#151B30] border border-gray-800 text-center text-gray-400 text-xs">
                  Aucun historique d'entretien enregistré pour ce véhicule.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {vehicleMaintenances.map(m => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-[#151B30] border border-gray-800 flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                            {m.type}
                          </span>
                          <p className="font-bold text-white">{m.description}</p>
                        </div>
                        <p className="text-gray-400 mt-1">
                          {m.garage || 'Atelier'} • {m.mileage} km • {m.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400 block">{m.cost} DT</span>
                        <span className="text-[10px] text-gray-400 font-mono">{m.performedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase font-mono">
                Réservations associées ({vehicleBookings.length})
              </span>
              {vehicleBookings.length === 0 ? (
                <p className="text-xs text-gray-400 p-3 text-center">Aucune location enregistrée pour ce véhicule.</p>
              ) : (
                vehicleBookings.map(bk => (
                  <div
                    key={bk.id}
                    className="p-3 rounded-xl bg-[#151B30] border border-gray-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-400">{bk.bookingNumber}</span>
                      <p className="font-bold text-white mt-0.5">{bk.clientName}</p>
                      <p className="text-gray-400">{bk.startDate} au {bk.endDate}</p>
                    </div>
                    <StatusBadge status={bk.status} size="small" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-[#151B30] border-t border-gray-800 flex items-center gap-3">
          <TactileButton variant="outline" className="flex-1" onClick={onClose}>
            Fermer
          </TactileButton>

          {vehicle.status === 'AVAILABLE' && onStartBooking && (
            <TactileButton
              variant="primary"
              className="flex-1 font-black"
              icon={Calendar}
              onClick={() => {
                onClose();
                onStartBooking(vehicle.id);
              }}
            >
              Louer ce Véhicule
            </TactileButton>
          )}
        </div>
      </div>
    </div>
  );
};
