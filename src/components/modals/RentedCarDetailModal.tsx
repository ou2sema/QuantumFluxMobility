import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, CheckIn, CheckOut, Vehicle } from '../../types';
import {
  Car,
  Camera,
  Calendar,
  Clock,
  Fuel,
  Gauge,
  User,
  ShieldCheck,
  FileText,
  AlertTriangle,
  X,
  Eye,
  CheckCircle2,
  ZoomIn,
  Key,
  RotateCcw,
  Sparkles,
  Printer,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { StatusBadge } from '../ui/StatusBadge';

interface RentedCarDetailModalProps {
  booking: Booking;
  onClose: () => void;
  onOpenContract?: (bookingId: string) => void;
  onStartCheckOut?: (booking: Booking) => void;
  onStartCheckIn?: (booking: Booking) => void;
}

const PHOTO_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  front: { label: '1. Face Avant', icon: '🚗', desc: 'Calandre, optiques & plaque d\'immatriculation' },
  rear: { label: '2. Face Arrière', icon: '🚘', desc: 'Coffre, feux arrière & pare-chocs' },
  left: { label: '3. Profil Gauche', icon: '🚙', desc: 'Côté conducteur, ailes & rétroviseur' },
  right: { label: '4. Profil Droit', icon: '🚙', desc: 'Côté passager, bas de caisse & trappe carburant' },
  interior: { label: '5. Habitacle & Sièges', icon: '💺', desc: 'Sellerie, volant, console centrale' },
  dashboard: { label: '6. Tableau de Bord', icon: '⏱️', desc: 'Compteur kilométrique & jauge carburant' },
};

export const RentedCarDetailModal: React.FC<RentedCarDetailModalProps> = ({
  booking,
  onClose,
  onOpenContract,
  onStartCheckOut,
  onStartCheckIn,
}) => {
  const { vehicles, clients, checkIns, checkOuts } = useApp();
  const [activeTab, setActiveTab] = useState<'PHOTOS' | 'INSPECTION' | 'SPECS' | 'CONTRACT'>('PHOTOS');
  const [selectedPhotoKey, setSelectedPhotoKey] = useState<string>('front');
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [photoComparisonMode, setPhotoComparisonMode] = useState<'CHECKIN' | 'CHECKOUT' | 'SPLIT'>('CHECKIN');

  const vehicle = vehicles.find(v => v.id === booking.vehicleId);
  const client = clients.find(c => c.id === booking.clientId);

  // Retrieve associated checkIn and checkOut
  const checkIn: CheckIn | undefined = checkIns.find(
    ci => ci.bookingId === booking.id || (booking.checkInId && ci.id === booking.checkInId)
  );
  const checkOut: CheckOut | undefined = checkOuts.find(
    co => co.bookingId === booking.id || (booking.checkOutId && co.id === booking.checkOutId)
  );

  // Fallback vehicle photos if not yet checked in
  const fallbackPhotos = {
    front: vehicle?.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    rear: vehicle?.images?.[1] || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80',
    left: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    right: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    interior: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    dashboard: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80',
  };

  const activeCheckInPhotos = checkIn?.photos || fallbackPhotos;
  const activeCheckOutPhotos = checkOut?.photos;

  const currentPhotoUrl =
    photoComparisonMode === 'CHECKOUT' && activeCheckOutPhotos
      ? (activeCheckOutPhotos as any)[selectedPhotoKey] || (activeCheckInPhotos as any)[selectedPhotoKey]
      : (activeCheckInPhotos as any)[selectedPhotoKey] || fallbackPhotos.front;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0D1224] border border-cyan-500/40 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[94vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#151B30] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black bg-[#0A0E1A] px-2 py-0.5 rounded text-cyan-400 border border-cyan-500/30">
                  {booking.vehiclePlate}
                </span>
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                  {booking.bookingNumber}
                </span>
                <StatusBadge status={booking.status} size="small" />
              </div>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                {booking.vehicleName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#0A0E1A] p-1.5 border-b border-gray-800 gap-1 overflow-x-auto">
          {[
            { id: 'PHOTOS', label: '📸 Photos Véhicule Prises', badge: checkIn ? '6 certifiées' : 'Modèle' },
            { id: 'INSPECTION', label: '🔍 État & Kilométrage / Jauge' },
            { id: 'SPECS', label: '⚙️ Fiche Technique' },
            { id: 'CONTRACT', label: '📄 Contrat & Caution' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-h-[42px] px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id ? 'bg-black/30 text-cyan-200' : 'bg-gray-800 text-gray-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* TAB 1: MANDATORY PHOTOS GALLERY */}
          {activeTab === 'PHOTOS' && (
            <div className="flex flex-col gap-4">
              {/* Photo Status Banner */}
              <div className="p-3.5 rounded-2xl bg-[#151B30] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {checkIn ? 'Photos d\'inspection horodatées & certifiées' : 'Photos de référence catalogue'}
                      {checkIn && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {checkIn
                        ? `Capturées le ${new Date(checkIn.timestamp).toLocaleString('fr-FR')} par ${checkIn.agentName}`
                        : 'Prise de vue des 6 angles obligatoires lors du Check-In'}
                    </p>
                  </div>
                </div>

                {checkOut && activeCheckOutPhotos && (
                  <div className="flex items-center gap-1 p-1 bg-[#0A0E1A] rounded-xl border border-gray-800">
                    <button
                      type="button"
                      onClick={() => setPhotoComparisonMode('CHECKIN')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        photoComparisonMode === 'CHECKIN' ? 'bg-cyan-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      Départ (Check-In)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoComparisonMode('CHECKOUT')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        photoComparisonMode === 'CHECKOUT' ? 'bg-blue-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      Retour (Check-Out)
                    </button>
                  </div>
                )}
              </div>

              {/* Main Photo Preview & Zoom */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-black h-64 sm:h-80 group">
                <img
                  src={currentPhotoUrl}
                  alt={PHOTO_LABELS[selectedPhotoKey]?.label || selectedPhotoKey}
                  className="w-full h-full object-contain bg-black/90"
                />

                {/* Overlays */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-gray-700 flex items-center gap-2">
                  <span>{PHOTO_LABELS[selectedPhotoKey]?.icon}</span>
                  <span>{PHOTO_LABELS[selectedPhotoKey]?.label}</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setZoomPhotoUrl({
                        url: currentPhotoUrl,
                        title: `${PHOTO_LABELS[selectedPhotoKey]?.label} - ${booking.vehicleName} (${booking.vehiclePlate})`,
                        subtitle: checkIn ? `Certifié Check-in le ${new Date(checkIn.timestamp).toLocaleDateString('fr-FR')}` : undefined,
                      })
                    }
                    className="p-2 rounded-xl bg-black/80 backdrop-blur-md text-cyan-300 hover:text-white border border-cyan-500/30 hover:bg-cyan-600 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Plein Écran HD</span>
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 rounded-xl border border-gray-800/80 flex items-center justify-between">
                  <p className="text-xs text-gray-300">
                    {PHOTO_LABELS[selectedPhotoKey]?.desc}
                  </p>
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 font-bold">
                    Plaque : {booking.vehiclePlate}
                  </span>
                </div>
              </div>

              {/* 6 Angle Thumbnail Selector Grid */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                  Sélectionner un angle de contrôle (6 photos certifiées)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(PHOTO_LABELS).map(([key, info]) => {
                    const imgUrl =
                      photoComparisonMode === 'CHECKOUT' && activeCheckOutPhotos
                        ? (activeCheckOutPhotos as any)[key] || (activeCheckInPhotos as any)[key]
                        : (activeCheckInPhotos as any)[key] || fallbackPhotos[key as keyof typeof fallbackPhotos];
                    const isSelected = selectedPhotoKey === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedPhotoKey(key)}
                        className={`relative rounded-xl overflow-hidden border p-1 text-left flex flex-col gap-1 cursor-pointer transition-all active:scale-95 ${
                          isSelected
                            ? 'border-cyan-400 bg-[#152342] ring-2 ring-cyan-400/40 shadow-lg'
                            : 'border-gray-800 bg-[#10172A] hover:border-gray-700'
                        }`}
                      >
                        <div className="h-14 sm:h-16 w-full rounded-lg overflow-hidden bg-black/60 relative">
                          <img
                            src={imgUrl}
                            alt={info.label}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                              <Eye className="w-5 h-5 text-cyan-300 drop-shadow" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-200 truncate px-0.5">
                          {info.label.split('. ')[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSPECTION DETAILS (MILEAGE, FUEL, DAMAGES) */}
          {activeTab === 'INSPECTION' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Check-In State Card */}
                <div className="p-4 rounded-2xl bg-[#151B30] border border-emerald-500/30 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <span className="font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                      <Key className="w-4 h-4" /> État au Départ (Check-In)
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {checkIn ? new Date(checkIn.timestamp).toLocaleDateString('fr-FR') : booking.startDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#0A0E1A] border border-gray-800">
                      <span className="text-[10px] text-gray-400 uppercase">Compteur départ</span>
                      <p className="font-mono font-black text-white text-base mt-0.5">
                        {checkIn ? checkIn.mileage.toLocaleString() : vehicle?.mileage?.toLocaleString() || '18 420'} km
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0A0E1A] border border-gray-800">
                      <span className="text-[10px] text-gray-400 uppercase">Carburant départ</span>
                      <p className="font-mono font-black text-cyan-400 text-base mt-0.5">
                        {checkIn ? `${checkIn.fuelLevel}%` : '100%'}
                      </p>
                    </div>
                  </div>

                  {checkIn?.agentName && (
                    <p className="text-[11px] text-gray-400">
                      Agent responsable : <strong className="text-gray-200">{checkIn.agentName}</strong>
                    </p>
                  )}

                  {checkIn?.signatureDataUrl && (
                    <div className="mt-1 p-2 rounded-xl bg-[#0A0E1A] border border-gray-800 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">Signature client départ</span>
                      <img src={checkIn.signatureDataUrl} alt="Signature Check-In" className="h-6 object-contain filter invert" />
                    </div>
                  )}
                </div>

                {/* Check-Out State Card (if exists or expected) */}
                <div className="p-4 rounded-2xl bg-[#151B30] border border-blue-500/30 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <span className="font-bold text-blue-400 uppercase font-mono flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" /> État au Retour (Check-Out)
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {checkOut ? new Date(checkOut.timestamp).toLocaleDateString('fr-FR') : booking.endDate}
                    </span>
                  </div>

                  {checkOut ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-[#0A0E1A] border border-gray-800">
                          <span className="text-[10px] text-gray-400 uppercase">Compteur retour</span>
                          <p className="font-mono font-black text-white text-base mt-0.5">
                            {checkOut.mileage.toLocaleString()} km
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            (+{checkOut.mileage - checkOut.startMileage} km roulés)
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#0A0E1A] border border-gray-800">
                          <span className="text-[10px] text-gray-400 uppercase">Carburant retour</span>
                          <p className="font-mono font-black text-cyan-400 text-base mt-0.5">
                            {checkOut.fuelLevel}%
                          </p>
                          {checkOut.missingFuelPercentage > 0 ? (
                            <span className="text-[10px] text-rose-400 font-bold">
                              -{checkOut.missingFuelPercentage}% manquant
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold">Niveau conforme</span>
                          )}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-[#0A0E1A] border border-gray-800 flex justify-between items-center">
                        <span className="text-gray-400">Caution restituée</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {checkOut.depositRefundAmount.toFixed(2)} DT
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-5 rounded-xl bg-[#0A0E1A] border border-dashed border-gray-800 text-center flex flex-col items-center justify-center gap-2">
                      <Clock className="w-6 h-6 text-blue-400 opacity-80" />
                      <p className="text-gray-300 font-medium">Véhicule actuellement en cours de location</p>
                      <p className="text-[11px] text-gray-500">Retour prévu le {booking.endDate} à {booking.endTime}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recorded Damages Section */}
              <div className="bg-[#151B30] p-4 rounded-2xl border border-gray-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Dommages relevés sur le véhicule ({vehicle?.damages?.length || 0})
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">Diagramme carrosserie certifié</span>
                </div>

                {(!vehicle?.damages || vehicle.damages.length === 0) ? (
                  <div className="p-3 rounded-xl bg-[#0A0E1A] border border-gray-800 text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Aucun dommage signalé - Véhicule en parfait état carrosserie & mécanique.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicle.damages.map((dmg, idx) => (
                      <div key={dmg.id || idx} className="p-2.5 rounded-xl bg-[#0A0E1A] border border-gray-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white capitalize">{dmg.part} - {dmg.type}</p>
                          <p className="text-[11px] text-gray-400">Gravité : {dmg.severity} • {dmg.isPreExisting ? 'Préexistant' : 'Nouveau'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dmg.severity === 'HEAVY' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {dmg.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VEHICLE SPECS */}
          {activeTab === 'SPECS' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Immatriculation</span>
                  <p className="text-sm font-extrabold text-cyan-400 font-mono mt-0.5">{booking.vehiclePlate}</p>
                </div>
                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Numéro VIN</span>
                  <p className="text-xs font-mono font-bold text-gray-300 mt-0.5">{vehicle?.vin || 'VF3M4HNSSLS098124'}</p>
                </div>
                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Transmission & Places</span>
                  <p className="text-xs font-bold text-white mt-0.5">{vehicle?.transmission} • {vehicle?.seats} places</p>
                </div>
                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Énergie</span>
                  <p className="text-xs font-bold text-white mt-0.5">{vehicle?.fuelType}</p>
                </div>
                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Tarif Journalier</span>
                  <p className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">{booking.dailyRate.toFixed(2)} DT / j</p>
                </div>
                <div className="bg-[#151B30] p-3 rounded-xl border border-gray-800">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Caution Requise</span>
                  <p className="text-sm font-extrabold text-amber-400 font-mono mt-0.5">{booking.depositAmount} DT</p>
                </div>
              </div>

              {/* Features */}
              {vehicle?.features && (
                <div className="bg-[#151B30] p-4 rounded-2xl border border-gray-800 flex flex-col gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase font-mono">Options & Équipements</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.features.map(f => (
                      <span key={f} className="px-2.5 py-1 rounded-lg bg-[#0A0E1A] border border-gray-800 text-xs text-gray-300 font-medium">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTRACT & CLIENT DETAILS */}
          {activeTab === 'CONTRACT' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#151B30] border border-gray-800 flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Locataire</span>
                  <p className="text-sm font-extrabold text-white mt-0.5">{booking.clientName}</p>
                  <p className="text-gray-400">{booking.clientPhone}</p>
                  <p className="text-gray-400">{booking.clientEmail}</p>
                  <p className="font-mono text-cyan-400 mt-1">Permis : {client?.licenseNumber || '26FR991823'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Montant Total</span>
                  <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{booking.totalAmount.toFixed(2)} DT</p>
                  <p className="text-[11px] text-gray-400">Caution : {booking.depositAmount} DT</p>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {booking.paymentStatus === 'PAID' ? 'Acquitté' : 'Paiement en attente'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#151B30] border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Contrat de location & Facture</p>
                  <p className="text-gray-400 text-[11px]">Édition officielle conforme avec conditions générales et fiche d'état des lieux</p>
                </div>
                {onOpenContract && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenContract(booking.id);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ouvrir Contrat</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#151B30] border-t border-gray-800 flex items-center justify-between gap-3">
          <TactileButton variant="outline" className="flex-1" onClick={onClose}>
            Fermer
          </TactileButton>

          {booking.status === 'CONFIRMED' && onStartCheckIn && (
            <TactileButton
              variant="success"
              className="flex-1 font-black"
              icon={Key}
              onClick={() => {
                onClose();
                onStartCheckIn(booking);
              }}
            >
              Faire Check-In
            </TactileButton>
          )}

          {booking.status === 'IN_PROGRESS' && onStartCheckOut && (
            <TactileButton
              variant="primary"
              className="flex-1 font-black"
              icon={RotateCcw}
              onClick={() => {
                onClose();
                onStartCheckOut(booking);
              }}
            >
              Faire Check-Out
            </TactileButton>
          )}

          {onOpenContract && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenContract(booking.id);
              }}
              className="min-h-[48px] px-4 rounded-xl bg-[#1A2338] border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Facture</span>
            </button>
          )}
        </div>
      </div>

      {/* FULLSCREEN PHOTO ZOOM MODAL */}
      {zoomPhotoUrl && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="w-full max-w-4xl flex items-center justify-between text-white pb-3 border-b border-gray-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                {zoomPhotoUrl.title}
              </h3>
              {zoomPhotoUrl.subtitle && (
                <p className="text-xs text-gray-400 mt-0.5">{zoomPhotoUrl.subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setZoomPhotoUrl(null)}
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center cursor-pointer active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 w-full max-w-4xl max-h-[80vh] flex items-center justify-center p-2">
            <img
              src={zoomPhotoUrl.url}
              alt={zoomPhotoUrl.title}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-gray-800"
            />
          </div>

          <div className="pt-2 text-center text-xs text-gray-400">
            Photo certifiée haute résolution • Prise sous protocole d'inspection 6 angles
          </div>
        </div>
      )}
    </div>
  );
};
