import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vehicle, VehicleCategory, VehicleStatus, FuelType, Transmission } from '../../types';
import {
  Car,
  X,
  Plus,
  Check,
  Fuel,
  Gauge,
  Sparkles,
  ShieldCheck,
  Wrench,
  Key,
  Camera,
  Upload,
  Image as ImageIcon,
  DollarSign,
  AlertTriangle,
  Layers,
  Trash2
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { PhotoUploadCaptureModal } from '../ui/PhotoUploadCaptureModal';

interface AddEditVehicleModalProps {
  vehicleToEdit?: Vehicle | null;
  onClose: () => void;
  onSuccess?: (vehicle: Vehicle) => void;
}

// High quality realistic car image presets for fast selection
const CATEGORY_IMAGE_PRESETS: Record<VehicleCategory, string[]> = {
  CITADINE: [
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80', // Red Hatchback
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80', // Blue Yaris/City
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80', // Silver Compact
  ],
  COMPACTE: [
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80', // Compact hatchback
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80', // Peugeot/VW
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80', // Modern Golf
  ],
  BERLINE: [
    'https://images.unsplash.com/photo-1555353540-64580b51c258?w=800&auto=format&fit=crop&q=80', // Sedan
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80', // Blue Sedan
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&auto=format&fit=crop&q=80', // Executive Sedan
  ],
  SUV: [
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80', // Modern SUV
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80', // Dark SUV
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', // Luxury Crossover
  ],
  UTILITAIRE: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80', // Commercial Van
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&auto=format&fit=crop&q=80', // White Utility Van
  ],
  PREMIUM: [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80', // Porsche/Mercedes
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80', // Sports Car
    'https://images.unsplash.com/photo-1555353540-64580b51c258?w=800&auto=format&fit=crop&q=80', // Luxury Line
  ],
  ELECTRIQUE: [
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80', // Tesla Model 3
    'https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800&auto=format&fit=crop&q=80', // EV Station
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80', // Electric Car
  ],
};

const STANDARD_FEATURE_OPTIONS = [
  'Climatisation automatique',
  'GPS / Navigation intégrée',
  'Apple CarPlay & Android Auto',
  'Caméra de recul & Radars 360',
  'Régulateur de vitesse adaptatif',
  'Sièges chauffants',
  'Accès & Démarrage mains libres',
  'Bluetooth & Prises USB-C',
  'Phares Full LED',
  'Alerte franchissement de ligne',
];

export const AddEditVehicleModal: React.FC<AddEditVehicleModalProps> = ({
  vehicleToEdit,
  onClose,
  onSuccess,
}) => {
  const { addVehicle, updateVehicle, deleteVehicle, agencies, currentAgency } = useApp();
  const isEditing = !!vehicleToEdit;

  // Form states
  const [brand, setBrand] = useState(vehicleToEdit?.brand || '');
  const [model, setModel] = useState(vehicleToEdit?.model || '');
  const [plate, setPlate] = useState(vehicleToEdit?.plate || '');
  const [vin, setVin] = useState(vehicleToEdit?.vin || `VF1${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
  const [year, setYear] = useState<number>(vehicleToEdit?.year || 2024);
  const [category, setCategory] = useState<VehicleCategory>(vehicleToEdit?.category || 'CITADINE');
  const [status, setStatus] = useState<VehicleStatus>(vehicleToEdit?.status || 'AVAILABLE');
  const [fuelType, setFuelType] = useState<FuelType>(vehicleToEdit?.fuelType || 'ESSENCE');
  const [transmission, setTransmission] = useState<Transmission>(vehicleToEdit?.transmission || 'MANUELLE');
  const [seats, setSeats] = useState<number>(vehicleToEdit?.seats || 5);
  const [doors, setDoors] = useState<number>(vehicleToEdit?.doors || 5);
  const [color, setColor] = useState(vehicleToEdit?.color || 'Gris Métallisé');
  const [mileage, setMileage] = useState<number>(vehicleToEdit?.mileage || 15000);
  const [currentFuelLevel, setCurrentFuelLevel] = useState<number>(vehicleToEdit?.currentFuelLevel || 100);
  const [fuelTankCapacity, setFuelTankCapacity] = useState<number>(vehicleToEdit?.fuelTankCapacity || 50);
  const [dailyRate, setDailyRate] = useState<number>(vehicleToEdit?.dailyRate || 49);
  const [depositAmount, setDepositAmount] = useState<number>(vehicleToEdit?.depositAmount || 800);
  const [excessKmRate, setExcessKmRate] = useState<number>(vehicleToEdit?.excessKmRate || 0.25);
  const [agencyId, setAgencyId] = useState(vehicleToEdit?.agencyId || currentAgency.id);
  const [imageUrl, setImageUrl] = useState<string>(
    vehicleToEdit?.images?.[0] || CATEGORY_IMAGE_PRESETS.CITADINE[0]
  );
  const [features, setFeatures] = useState<string[]>(
    vehicleToEdit?.features || ['Climatisation automatique', 'GPS / Navigation intégrée', 'Bluetooth & Prises USB-C']
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoModalFacing, setPhotoModalFacing] = useState<'environment' | 'user'>('environment');

  // Quick Preset Selection handler for Category
  const handleCategoryChange = (newCat: VehicleCategory) => {
    setCategory(newCat);
    // If user hasn't explicitly customized the image or in add mode, suggest a photo matching new category
    if (!vehicleToEdit) {
      setImageUrl(CATEGORY_IMAGE_PRESETS[newCat][0]);
    }
  };

  const toggleFeature = (feat: string) => {
    setFeatures(prev =>
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim()) {
      setErrorMsg('Veuillez renseigner la marque du véhicule.');
      return;
    }
    if (!model.trim()) {
      setErrorMsg('Veuillez renseigner le modèle du véhicule.');
      return;
    }
    if (!plate.trim()) {
      setErrorMsg('Veuillez renseigner la plaque d’immatriculation.');
      return;
    }

    const payload = {
      brand: brand.trim(),
      model: model.trim(),
      plate: plate.trim().toUpperCase(),
      vin: vin.trim().toUpperCase(),
      year: Number(year),
      category,
      status,
      fuelType,
      transmission,
      seats: Number(seats),
      doors: Number(doors),
      color: color.trim(),
      mileage: Number(mileage),
      currentFuelLevel: Number(currentFuelLevel),
      fuelTankCapacity: Number(fuelTankCapacity),
      dailyRate: Number(dailyRate),
      depositAmount: Number(depositAmount),
      excessKmRate: Number(excessKmRate),
      fuelMissingRatePerLiter: 2.50,
      agencyId,
      images: [imageUrl],
      features,
      nextMaintenanceMileage: Number(mileage) + 15000,
    };

    if (isEditing && vehicleToEdit) {
      updateVehicle(vehicleToEdit.id, payload);
      if (onSuccess) onSuccess({ ...vehicleToEdit, ...payload });
    } else {
      const created = addVehicle(payload);
      if (onSuccess) onSuccess(created);
    }

    onClose();
  };

  const handleDelete = () => {
    if (vehicleToEdit) {
      deleteVehicle(vehicleToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0D1224] border border-gray-800 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl animate-in fade-in">
        {/* Header */}
        <div className="px-5 py-4 bg-[#151B30] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                {isEditing ? 'Édition Flotte' : 'Nouveau Véhicule'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isEditing ? `Modifier ${vehicleToEdit.brand} ${vehicleToEdit.model}` : 'Ajouter un Véhicule'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Statut Opérationnel (Crucial for User Request) */}
          <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Statut Opérationnel Immédiat
              </span>
              <span className="text-[11px] text-gray-400 font-mono">Sélection rapide</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                {
                  id: 'AVAILABLE',
                  label: 'Disponible',
                  desc: 'Prêt à louer',
                  activeClass: 'bg-green-600 text-white border-green-400 shadow-green-950/50',
                  dot: 'bg-green-400',
                },
                {
                  id: 'RESERVED',
                  label: 'Réservé',
                  desc: 'Attente client',
                  activeClass: 'bg-purple-600 text-white border-purple-400 shadow-purple-950/50',
                  dot: 'bg-purple-400',
                },
                {
                  id: 'RENTED',
                  label: 'Déjà Loué',
                  desc: 'En contrat',
                  activeClass: 'bg-blue-600 text-white border-blue-400 shadow-blue-950/50',
                  dot: 'bg-blue-400',
                },
                {
                  id: 'MAINTENANCE',
                  label: 'Maintenance',
                  desc: 'Atelier / Révision',
                  activeClass: 'bg-orange-500 text-white border-orange-400 shadow-orange-950/50',
                  dot: 'bg-orange-400',
                },
                {
                  id: 'UNAVAILABLE',
                  label: 'Indisponible',
                  desc: 'Hors service',
                  activeClass: 'bg-rose-600 text-white border-rose-400 shadow-rose-950/50',
                  dot: 'bg-rose-400',
                },
              ].map(st => {
                const isSelected = status === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatus(st.id as VehicleStatus)}
                    className={`min-h-[58px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? `${st.activeClass} shadow-md`
                        : 'bg-[#0A0E1A] text-gray-300 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wide">{st.label}</span>
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : st.dot}`} />
                    </div>
                    <span className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                      {st.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Identification & Catégorie */}
          <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Identification du Véhicule
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Marque <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Peugeot, Renault, Tesla..."
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Modèle <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: 208 GT, Clio V, Model 3..."
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Immatriculation <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: FK-842-AX"
                  value={plate}
                  onChange={e => setPlate(e.target.value.toUpperCase())}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-cyan-400 font-mono font-bold text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Numéro Châssis / VIN
                </label>
                <input
                  type="text"
                  placeholder="17 caractères"
                  value={vin}
                  onChange={e => setVin(e.target.value.toUpperCase())}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-gray-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Année de mise en circulation
                </label>
                <input
                  type="number"
                  min="2015"
                  max="2027"
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-semibold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Catégorie de Véhicule
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CITADINE', 'COMPACTE', 'BERLINE', 'SUV', 'UTILITAIRE', 'PREMIUM', 'ELECTRIQUE'] as VehicleCategory[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`min-h-[46px] px-3 rounded-lg border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      category === cat
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-[#0A0E1A] text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Caractéristiques Techniques & Compteur */}
          <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              Compteur, Énergie & Transmission
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Kilométrage Actuel (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={mileage}
                  onChange={e => setMileage(Number(e.target.value))}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Niveau Carburant / Batterie (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentFuelLevel}
                    onChange={e => setCurrentFuelLevel(Number(e.target.value))}
                    className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-cyan-400 font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentFuelLevel(100)}
                      className="px-2 py-1 bg-green-950/60 text-green-400 text-[10px] font-bold rounded border border-green-800 hover:bg-green-900"
                    >
                      Plein
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentFuelLevel(50)}
                      className="px-2 py-1 bg-gray-800 text-gray-300 text-[10px] font-bold rounded border border-gray-700 hover:bg-gray-700"
                    >
                      1/2
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Agence Assignée
                </label>
                <select
                  value={agencyId}
                  onChange={e => setAgencyId(e.target.value)}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-semibold text-xs focus:outline-none focus:border-blue-500"
                >
                  {agencies.map(ag => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Carburant</label>
                <select
                  value={fuelType}
                  onChange={e => setFuelType(e.target.value as FuelType)}
                  className="w-full min-h-[50px] px-3 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-semibold text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ESSENCE">Essence</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="HYBRIDE">Hybride</option>
                  <option value="ELECTRIQUE">Électrique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Boîte</label>
                <select
                  value={transmission}
                  onChange={e => setTransmission(e.target.value as Transmission)}
                  className="w-full min-h-[50px] px-3 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-semibold text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="MANUELLE">Manuelle</option>
                  <option value="AUTOMATIQUE">Automatique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Places</label>
                <input
                  type="number"
                  min="2"
                  max="9"
                  value={seats}
                  onChange={e => setSeats(Number(e.target.value))}
                  className="w-full min-h-[50px] px-3 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-semibold text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Portes</label>
                <input
                  type="number"
                  min="2"
                  max="5"
                  value={doors}
                  onChange={e => setDoors(Number(e.target.value))}
                  className="w-full min-h-[50px] px-3 rounded-xl bg-[#0A0E1A] border border-gray-800 text-white font-semibold text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Tarification & Caution */}
          <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Tarification & Caution
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Tarif Journalier (DT / jour)
                </label>
                <input
                  type="number"
                  min="10"
                  step="1"
                  value={dailyRate}
                  onChange={e => setDailyRate(Number(e.target.value))}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-emerald-400 font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Caution Requise (DT)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-amber-400 font-mono font-bold text-base focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Frais KM Supp. (DT / km)
                </label>
                <input
                  type="number"
                  min="0.10"
                  step="0.05"
                  value={excessKmRate}
                  onChange={e => setExcessKmRate(Number(e.target.value))}
                  className="w-full min-h-[52px] px-3.5 rounded-xl bg-[#0A0E1A] border border-gray-800 text-gray-300 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Photo du Véhicule */}
          <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                Photo du Véhicule
              </span>
              <span className="text-[11px] text-cyan-400 font-semibold">
                Depuis appareil ou caméra directe
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-black/60 border border-gray-700 flex-shrink-0 relative group">
                <img
                  src={imageUrl}
                  alt="Aperçu véhicule"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalFacing('environment');
                    setShowPhotoModal(true);
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer p-2 text-center"
                >
                  <Camera className="w-6 h-6 mb-1 text-blue-400" />
                  <span className="text-[11px] font-bold">Changer la photo</span>
                </button>
              </div>

              <div className="flex-1 w-full space-y-3">
                {/* Action Buttons: Direct Camera & Device Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoModalFacing('environment');
                      setShowPhotoModal(true);
                    }}
                    className="min-h-[46px] px-3.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-blue-400" />
                    <span>Prendre en photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhotoModalFacing('environment');
                      setShowPhotoModal(true);
                    }}
                    className="min-h-[46px] px-3.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Importer du fichier</span>
                  </button>
                </div>

                {/* Preset suggestions */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1.5">
                    Ou modèles prédéfinis ({category}) :
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {CATEGORY_IMAGE_PRESETS[category].map((presetUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(presetUrl)}
                        className={`w-14 h-11 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                          imageUrl === presetUrl
                            ? 'border-blue-500 scale-105 shadow-md ring-1 ring-blue-400'
                            : 'border-gray-800 opacity-60 hover:opacity-100'
                        }`}
                        title={`Modèle ${idx + 1}`}
                      >
                        <img src={presetUrl} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="url"
                  placeholder="Ou collez une URL d'image personnalisée..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0A0E1A] border border-gray-800 text-gray-300 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Équipements de Série */}
          <div className="bg-[#151B30] p-4 rounded-xl border border-gray-800 space-y-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Équipements & Options de Série
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STANDARD_FEATURE_OPTIONS.map(feat => {
                const isSelected = features.includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => toggleFeature(feat)}
                    className={`min-h-[44px] px-3 rounded-lg border text-left flex items-center justify-between text-xs transition-all active:scale-98 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/40 text-blue-200 border-blue-500/50 font-bold'
                        : 'bg-[#0A0E1A] text-gray-400 border-gray-800 hover:text-gray-300'
                    }`}
                  >
                    <span>{feat}</span>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'border-gray-700 bg-gray-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete Option if editing */}
          {isEditing && (
            <div className="pt-2">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full min-h-[48px] rounded-xl border border-rose-900/60 bg-rose-950/20 text-rose-400 text-xs font-bold uppercase tracking-wider hover:bg-rose-950/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer ce véhicule de la flotte
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500 flex flex-col gap-3">
                  <p className="text-xs text-rose-200 font-bold text-center">
                    Êtes-vous sûr de vouloir supprimer définitivement {vehicleToEdit?.brand} {vehicleToEdit?.model} ({vehicleToEdit?.plate}) ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 min-h-[46px] rounded-lg bg-gray-800 text-gray-200 text-xs font-bold uppercase"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 min-h-[46px] rounded-lg bg-rose-600 text-white text-xs font-bold uppercase shadow-lg shadow-rose-950/50"
                    >
                      Confirmer la suppression
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-[#151B30] border-t border-gray-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[56px] px-6 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase text-xs tracking-wider active:scale-95 transition-transform cursor-pointer"
          >
            Annuler
          </button>

          <TactileButton
            variant="primary"
            size="normal"
            className="flex-1 font-black"
            icon={Check}
            onClick={handleSubmit}
          >
            {isEditing ? 'Enregistrer les Modifications' : 'Ajouter le Véhicule'}
          </TactileButton>
        </div>
      </div>

      {/* Unified Camera / Device Photo Picker Modal */}
      {showPhotoModal && (
        <PhotoUploadCaptureModal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onPhotoSelected={(url) => setImageUrl(url)}
          title={`Photo du véhicule - ${brand || 'Nouveau véhicule'} ${model || ''}`}
          subtitle="Prenez une photo en direct avec la caméra ou importez depuis vos fichiers"
          aspectRatio="wide"
          defaultFacingMode={photoModalFacing}
          currentPhotoUrl={imageUrl}
        />
      )}
    </div>
  );
};
