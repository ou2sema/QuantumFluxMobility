import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { MaintenanceRecord, MaintenanceType, Vehicle, VehicleStatus } from '../../types';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Gauge,
  Plus,
  Car,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Disc,
  Droplet,
  Fuel,
  Settings,
  Layers,
  FileText,
  X
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';

const MAINTENANCE_TYPES: { type: MaintenanceType; label: string; intervalKm: number; icon: any; color: string }[] = [
  { type: 'VIDANGE', label: 'Vidange Moteur + Filtre Huile', intervalKm: 10000, icon: Droplet, color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  { type: 'PLAQUETTES_FREIN', label: 'Remplacement Plaquettes de Frein', intervalKm: 30000, icon: Disc, color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' },
  { type: 'DISQUES_FREIN', label: 'Disques & Plaquettes de Frein', intervalKm: 60000, icon: Disc, color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  { type: 'PNEUMATIQUES', label: 'Remplacement Pneumatiques', intervalKm: 40000, icon: Car, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  { type: 'FILTRES', label: 'Filtres Habitacle & Air', intervalKm: 20000, icon: Layers, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  { type: 'CONTROLE_TECHNIQUE', label: 'Contrôle Technique Périodique', intervalKm: 50000, icon: ShieldCheck, color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  { type: 'REVISION_GENERALE', label: 'Grande Révision Constructeur', intervalKm: 25000, icon: Settings, color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  { type: 'AUTRE', label: 'Autre Intervention d\'Atelier', intervalKm: 15000, icon: Wrench, color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
];

export const MaintenanceView: React.FC = () => {
  const { vehicles, maintenances, addMaintenanceRecord, updateVehicleStatus, currentUser } = useApp();
  const { isAgentTechnique, isAdmin, canChangeVehicleStatus } = useAuth();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedVehicleForService, setSelectedVehicleForService] = useState<Vehicle | null>(null);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<MaintenanceType>('VIDANGE');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [mileage, setMileage] = useState<number>(0);
  const [cost, setCost] = useState<number>(150);
  const [invoiceRef, setInvoiceRef] = useState<string>('');
  const [setAvailableAfter, setSetAvailableAfter] = useState<boolean>(true);

  // Maintenance statistics
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'MAINTENANCE');
  
  // Vehicles needing vidange (< 1500 km remaining)
  const vidangeAlerts = vehicles.filter(v => {
    const nextDue = v.nextMaintenanceMileage || 25000;
    const remaining = nextDue - v.mileage;
    return remaining <= 2000;
  });

  const handleOpenAddModal = (veh?: Vehicle, defaultType: MaintenanceType = 'VIDANGE') => {
    const target = veh || vehicles[0];
    setSelectedVehicleId(target ? target.id : '');
    setSelectedType(defaultType);
    const typeObj = MAINTENANCE_TYPES.find(t => t.type === defaultType);
    setTitle(typeObj ? typeObj.label : 'Entretien programmé');
    setDescription('');
    setMileage(target ? target.mileage : 20000);
    setCost(defaultType === 'VIDANGE' ? 180 : defaultType === 'PLAQUETTES_FREIN' ? 140 : 250);
    setInvoiceRef(`FAC-ATEL-${Math.floor(1000 + Math.random() * 9000)}`);
    setSetAvailableAfter(true);
    setShowAddModal(true);
  };

  const handleSubmitMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    const typeConfig = MAINTENANCE_TYPES.find(t => t.type === selectedType);
    const interval = typeConfig ? typeConfig.intervalKm : 10000;
    const nextDue = mileage + interval;

    // Add maintenance record
    addMaintenanceRecord({
      vehicleId: vehicle.id,
      vehiclePlate: vehicle.plate,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      type: selectedType,
      title: title || `${typeConfig?.label} (${vehicle.plate})`,
      description: description || `Intervention effectuée au compteur de ${mileage} km.`,
      cost: Number(cost) || 0,
      mileageAtService: Number(mileage),
      serviceDate: new Date().toISOString().split('T')[0],
      nextDueMileage: nextDue,
      nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      technicianName: currentUser.name || 'Nader Mejri',
      invoiceRef: invoiceRef.trim(),
      status: 'DONE',
    });

    // If vehicle was in maintenance and checkbox checked, restore to AVAILABLE
    if (setAvailableAfter && vehicle.status === 'MAINTENANCE') {
      updateVehicleStatus(vehicle.id, 'AVAILABLE');
    }

    setShowAddModal(false);
  };

  const handleToggleVehicleStatus = (vehicle: Vehicle) => {
    const newStatus: VehicleStatus = vehicle.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    updateVehicleStatus(vehicle.id, newStatus);
  };

  const filteredMaintenances = maintenances.filter(m => {
    const matchesSearch =
      m.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-28">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#10162A] border border-gray-800 p-5 rounded-3xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Atelier Technique & Entretien</h1>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Agent Technique
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Suivi des vidanges, plaquettes de frein, révisions et statut de maintenance de la flotte
            </p>
          </div>
        </div>

        <TactileButton
          variant="primary"
          onClick={() => handleOpenAddModal()}
          className="h-11 px-4 gap-2 text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Intervention</span>
        </TactileButton>
      </div>

      {/* KPI Cards: Atelier Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Vehicles currently in maintenance */}
        <div className="bg-[#10162A] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">En Maintenance</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-orange-400 font-mono">
              {vehiclesInMaintenance.length}
            </span>
            <span className="text-xs text-gray-500 ml-2">véhicule(s) immobilisé(s)</span>
          </div>
        </div>

        {/* Vidange alerts */}
        <div className="bg-[#10162A] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">Vidanges Urgentes</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {vidangeAlerts.length}
            </span>
            <span className="text-xs text-gray-500 ml-2">&lt; 2 000 km restant</span>
          </div>
        </div>

        {/* Total Interventions Recorded */}
        <div className="bg-[#10162A] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">Total Interventions</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
              {maintenances.length}
            </span>
            <span className="text-xs text-gray-500 ml-2">travaux réalisés</span>
          </div>
        </div>

        {/* Workshop Expense Total */}
        <div className="bg-[#10162A] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase font-mono">Dépenses Atelier</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {maintenances.reduce((acc, curr) => acc + (curr.cost || 0), 0).toFixed(0)} DT
            </span>
            <span className="text-xs text-gray-500 ml-2">cumul total</span>
          </div>
        </div>
      </div>

      {/* Urgent Maintenance Needed Section */}
      <div className="bg-[#10162A] border border-gray-800 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Alertes & Échéances d'Entretien (Vidanges, Freins)</h2>
          </div>
          <span className="text-xs text-gray-400 font-mono">Surveillance kilométrique automatique</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {vehicles.map(veh => {
            const nextDue = veh.nextMaintenanceMileage || 25000;
            const remainingKm = nextDue - veh.mileage;
            const isCritical = remainingKm <= 1000;
            const isWarning = remainingKm <= 2500;
            const isUnderMaintenance = veh.status === 'MAINTENANCE';

            return (
              <div
                key={veh.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                  isUnderMaintenance
                    ? 'bg-orange-950/20 border-orange-500/40'
                    : isCritical
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-[#151B30] border-gray-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {veh.brand} {veh.model}
                      </h3>
                      <span className="text-xs font-mono font-black text-cyan-400">{veh.plate}</span>
                    </div>
                    <StatusBadge status={veh.status} size="small" />
                  </div>

                  <div className="mt-3 flex flex-col gap-1.5 text-xs text-gray-300">
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-400">Compteur actuel :</span>
                      <span className="font-bold text-white">{veh.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-400">Prochaine vidange :</span>
                      <span className="font-bold text-amber-300">{nextDue.toLocaleString()} km</span>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${
                          isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (veh.mileage / nextDue) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Reste avant vidange :</span>
                      <span className={`font-bold ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {remainingKm > 0 ? `~${remainingKm} km` : 'Échue (À faire immédiatement)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions for Agent Technique */}
                <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleVehicleStatus(veh)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer border ${
                      veh.status === 'MAINTENANCE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30'
                    }`}
                  >
                    {veh.status === 'MAINTENANCE' ? '✓ Remettre Disponible' : 'Mettre en Maintenance'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(veh, 'VIDANGE')}
                      className="px-2 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Enregistrer la vidange"
                    >
                      <Droplet className="w-3.5 h-3.5" />
                      <span>Vidange</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(veh, 'PLAQUETTES_FREIN')}
                      className="px-2 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Enregistrer le remplacement des plaquettes"
                    >
                      <Disc className="w-3.5 h-3.5" />
                      <span>Freins</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History of Services Performed */}
      <div className="bg-[#10162A] border border-gray-800 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Historique des Travaux & Interventions Réalisées ({filteredMaintenances.length})
            </h2>
            <p className="text-xs text-gray-400">Carnet d'entretien et réparations validées</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par immat ou type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-8 pr-3 rounded-xl bg-[#151B30] border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48 sm:w-60"
              />
            </div>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#151B30] border border-gray-800 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Tous les types</option>
              {MAINTENANCE_TYPES.map(t => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredMaintenances.length === 0 ? (
          <div className="p-8 text-center bg-[#151B30] rounded-2xl border border-gray-800 text-gray-400 text-xs">
            Aucun enregistrement d'entretien ne correspond aux filtres.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredMaintenances.map(m => {
              const meta = MAINTENANCE_TYPES.find(t => t.type === m.type) || MAINTENANCE_TYPES[0];
              const Icon = meta.icon;

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-[#151B30] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${meta.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{m.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0A0E1A] text-cyan-300 border border-gray-700">
                          {m.vehiclePlate}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 font-mono mt-1">
                        <span>Date : {m.serviceDate}</span>
                        <span>•</span>
                        <span>Kilométrage : {m.mileageAtService.toLocaleString()} km</span>
                        <span>•</span>
                        <span>Technicien : {m.technicianName}</span>
                        {m.invoiceRef && (
                          <>
                            <span>•</span>
                            <span className="text-gray-400">Réf : {m.invoiceRef}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-800">
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {m.cost.toFixed(2)} DT
                    </span>
                    {m.nextDueMileage && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        Rappel : {m.nextDueMileage.toLocaleString()} km
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Maintenance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#10162A] border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Enregistrer une Intervention Atelier</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-[#0A0E1A] border border-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMaintenance} className="flex flex-col gap-3.5 text-xs">
              {/* Vehicle selector */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-300 font-medium">Véhicule concerné *</label>
                <select
                  value={selectedVehicleId}
                  onChange={e => {
                    setSelectedVehicleId(e.target.value);
                    const v = vehicles.find(veh => veh.id === e.target.value);
                    if (v) setMileage(v.mileage);
                  }}
                  className="h-10 px-3 rounded-xl bg-[#151B30] border border-gray-700 text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} ({v.plate}) — {v.mileage} km [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Maintenance Type */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-300 font-medium">Type d'intervention *</label>
                <select
                  value={selectedType}
                  onChange={e => {
                    const newType = e.target.value as MaintenanceType;
                    setSelectedType(newType);
                    const t = MAINTENANCE_TYPES.find(x => x.type === newType);
                    if (t) setTitle(t.label);
                  }}
                  className="h-10 px-3 rounded-xl bg-[#151B30] border border-gray-700 text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {MAINTENANCE_TYPES.map(t => (
                    <option key={t.type} value={t.type}>{t.label} (Intervalle: ~{t.intervalKm.toLocaleString()} km)</option>
                  ))}
                </select>
              </div>

              {/* Description & title */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-300 font-medium">Intitulé / Travaux effectués *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-[#151B30] border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Vidange 5W30 + remplacement plaquettes avant"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-300 font-medium">Kilométrage actuel (km) *</label>
                  <input
                    type="number"
                    required
                    value={mileage}
                    onChange={e => setMileage(Number(e.target.value))}
                    className="h-10 px-3 rounded-xl bg-[#151B30] border border-gray-700 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-300 font-medium">Coût de l'intervention (DT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cost}
                    onChange={e => setCost(Number(e.target.value))}
                    className="h-10 px-3 rounded-xl bg-[#151B30] border border-gray-700 text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-300 font-medium">Référence Facture / Bon atelier</label>
                <input
                  type="text"
                  value={invoiceRef}
                  onChange={e => setInvoiceRef(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-[#151B30] border border-gray-700 text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="FAC-ATEL-1234"
                />
              </div>

              {/* Status restore checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#151B30] border border-gray-800 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={setAvailableAfter}
                  onChange={e => setSetAvailableAfter(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-white">
                  Marquer le véhicule comme <strong className="text-emerald-400">DISPONIBLE</strong> immédiatement après intervention
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800 mt-2">
                <TactileButton variant="outline" onClick={() => setShowAddModal(false)}>
                  Annuler
                </TactileButton>
                <TactileButton type="submit" variant="primary" className="px-5">
                  Valider l'Intervention
                </TactileButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
