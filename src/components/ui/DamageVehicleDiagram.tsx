import React, { useState } from 'react';
import { DamageItem, DamageSeverity, DamageType, DamageZone } from '../../types';
import { AlertCircle, Camera, Check, Plus, Trash2, X } from 'lucide-react';
import { TactileButton } from './TactileButton';
import { TactileInput } from './TactileInput';

interface DamageVehicleDiagramProps {
  damages: DamageItem[];
  onAddDamage?: (damage: Omit<DamageItem, 'id' | 'addedAt'>) => void;
  onRemoveDamage?: (damageId: string) => void;
  readOnly?: boolean;
}

const ZONE_NAMES: Record<DamageZone, string> = {
  FRONT: 'Avant (Pare-chocs / Capot)',
  REAR: 'Arrière (Coffre / Bouclier)',
  LEFT: 'Côté Gauche (Portières / Aile)',
  RIGHT: 'Côté Droit (Portières / Aile)',
  ROOF: 'Toit / Pavillon',
  WINDSHIELD: 'Pare-brise & Vitres',
  WHEELS: 'Jantes & Pneumatiques',
  INTERIOR: 'Habitacle Intérieur',
};

const DAMAGE_TYPE_NAMES: Record<DamageType, string> = {
  SCRATCH: 'Rayure / Éraflure',
  DENT: 'Enfoncement / Bosse',
  CRACK: 'Fissure / Impact',
  STAIN: 'Tâche / Salissure',
  BROKEN_PART: 'Élément cassé',
  OTHER: 'Autre dommage',
};

export const DamageVehicleDiagram: React.FC<DamageVehicleDiagramProps> = ({
  damages,
  onAddDamage,
  onRemoveDamage,
  readOnly = false,
}) => {
  const [selectedZone, setSelectedZone] = useState<DamageZone | null>(null);
  const [activeModal, setActiveModal] = useState<boolean>(false);
  const [newType, setNewType] = useState<DamageType>('SCRATCH');
  const [newSeverity, setNewSeverity] = useState<DamageSeverity>('LOW');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newEstimatedCost, setNewEstimatedCost] = useState<number>(50);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');

  const handleZoneClick = (zone: DamageZone) => {
    if (readOnly) return;
    setSelectedZone(zone);
    setNewDescription(`Dommage constaté sur zone ${ZONE_NAMES[zone]}`);
    setActiveModal(true);
  };

  const handleSaveDamage = () => {
    if (!selectedZone || !onAddDamage) return;

    onAddDamage({
      zone: selectedZone,
      type: newType,
      severity: newSeverity,
      description: newDescription || `Dommage sur zone ${ZONE_NAMES[selectedZone]}`,
      estimatedCost: Number(newEstimatedCost) || 0,
      photoUrl: newPhotoUrl || undefined,
      addedByCheckType: 'CHECK_IN',
      isPreExisting: false,
    });

    setActiveModal(false);
    setSelectedZone(null);
    setNewDescription('');
    setNewPhotoUrl('');
  };

  const getDamagesForZone = (zone: DamageZone) => {
    return damages.filter(d => d.zone === zone);
  };

  return (
    <div className="w-full bg-[#10172A] rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Schéma d'état du véhicule</span>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-mono font-bold">
              {damages.length} dommage{damages.length > 1 ? 's' : ''}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {readOnly
              ? 'Consultez les zones endommagées ci-dessous.'
              : 'Touchez une zone pour consigner un dommage (rayure, choc, impact).'}
          </p>
        </div>
      </div>

      {/* Interactive Top-down Car Blueprint */}
      <div className="relative w-full max-w-sm mx-auto bg-[#0A0E1A] rounded-2xl p-4 border border-slate-800 flex flex-col items-center">
        {/* Car Silhouette SVG with touch hotspots */}
        <div className="relative w-64 h-96 select-none">
          {/* Base Wireframe */}
          <svg viewBox="0 0 200 320" className="w-full h-full drop-shadow-md">
            {/* Tires */}
            <rect x="18" y="45" width="16" height="40" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="2" />
            <rect x="166" y="45" width="16" height="40" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="2" />
            <rect x="18" y="235" width="16" height="40" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="2" />
            <rect x="166" y="235" width="16" height="40" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="2" />

            {/* Car Body Outer Shell */}
            <path
              d="M 45 40 
                 C 55 12, 145 12, 155 40 
                 C 170 65, 175 120, 175 160 
                 C 175 220, 170 280, 155 305 
                 C 145 315, 55 315, 45 305 
                 C 30 280, 25 220, 25 160 
                 C 25 120, 30 65, 45 40 Z"
              fill="#131D33"
              stroke="#3B82F6"
              strokeWidth="2.5"
            />

            {/* Windshield */}
            <path
              d="M 52 75 
                 C 65 60, 135 60, 148 75 
                 L 142 110 
                 C 130 102, 70 102, 58 110 Z"
              fill="#1E293B"
              stroke="#60A5FA"
              strokeWidth="1.5"
            />

            {/* Roof */}
            <rect x="58" y="115" width="84" height="90" rx="10" fill="#0E1726" stroke="#475569" strokeWidth="1.5" />

            {/* Rear Windshield */}
            <path
              d="M 58 210 
                 C 70 216, 130 216, 142 210 
                 L 148 245 
                 C 135 255, 65 255, 52 245 Z"
              fill="#1E293B"
              stroke="#60A5FA"
              strokeWidth="1.5"
            />

            {/* Front Headlights */}
            <ellipse cx="52" cy="30" rx="12" ry="6" fill="#FBBF24" opacity="0.8" />
            <ellipse cx="148" cy="30" rx="12" ry="6" fill="#FBBF24" opacity="0.8" />

            {/* Rear Taillights */}
            <ellipse cx="50" cy="310" rx="12" ry="5" fill="#EF4444" opacity="0.8" />
            <ellipse cx="150" cy="310" rx="12" ry="5" fill="#EF4444" opacity="0.8" />
          </svg>

          {/* Interactive Touch Buttons overlaid onto Zones */}
          
          {/* FRONT */}
          <button
            type="button"
            onClick={() => handleZoneClick('FRONT')}
            className={`absolute top-2 left-1/2 -translate-x-1/2 w-28 h-12 rounded-xl flex items-center justify-center gap-1 text-xs font-bold transition-transform active:scale-95 ${
              getDamagesForZone('FRONT').length > 0
                ? 'bg-rose-600/80 text-white border-2 border-rose-400 animate-pulse'
                : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-500/30'
            }`}
          >
            <span>AVANT</span>
            {getDamagesForZone('FRONT').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {getDamagesForZone('FRONT').length}
              </span>
            )}
          </button>

          {/* WINDSHIELD & ROOF */}
          <button
            type="button"
            onClick={() => handleZoneClick('WINDSHIELD')}
            className={`absolute top-20 left-1/2 -translate-x-1/2 w-24 h-10 rounded-lg flex items-center justify-center gap-1 text-[11px] font-bold transition-transform active:scale-95 ${
              getDamagesForZone('WINDSHIELD').length > 0
                ? 'bg-rose-600/80 text-white border-2 border-rose-400'
                : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 border border-slate-600'
            }`}
          >
            <span>VITRES</span>
            {getDamagesForZone('WINDSHIELD').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                {getDamagesForZone('WINDSHIELD').length}
              </span>
            )}
          </button>

          {/* LEFT SIDE */}
          <button
            type="button"
            onClick={() => handleZoneClick('LEFT')}
            className={`absolute top-28 left-0 w-12 h-36 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-transform active:scale-95 ${
              getDamagesForZone('LEFT').length > 0
                ? 'bg-rose-600/80 text-white border-2 border-rose-400'
                : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-500/30'
            }`}
          >
            <span>G</span>
            <span>A</span>
            <span>U</span>
            <span>C</span>
            <span>H</span>
            <span>E</span>
            {getDamagesForZone('LEFT').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold mt-1">
                {getDamagesForZone('LEFT').length}
              </span>
            )}
          </button>

          {/* RIGHT SIDE */}
          <button
            type="button"
            onClick={() => handleZoneClick('RIGHT')}
            className={`absolute top-28 right-0 w-12 h-36 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-transform active:scale-95 ${
              getDamagesForZone('RIGHT').length > 0
                ? 'bg-rose-600/80 text-white border-2 border-rose-400'
                : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-500/30'
            }`}
          >
            <span>D</span>
            <span>R</span>
            <span>O</span>
            <span>I</span>
            <span>T</span>
            <span>E</span>
            {getDamagesForZone('RIGHT').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold mt-1">
                {getDamagesForZone('RIGHT').length}
              </span>
            )}
          </button>

          {/* ROOF & INTERIOR */}
          <button
            type="button"
            onClick={() => handleZoneClick('INTERIOR')}
            className={`absolute top-36 left-1/2 -translate-x-1/2 w-20 h-16 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-transform active:scale-95 ${
              getDamagesForZone('INTERIOR').length > 0
                ? 'bg-rose-600/80 text-white border-2 border-rose-400'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-600'
            }`}
          >
            <span>HABITACLE</span>
            {getDamagesForZone('INTERIOR').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold mt-0.5">
                {getDamagesForZone('INTERIOR').length}
              </span>
            )}
          </button>

          {/* REAR */}
          <button
            type="button"
            onClick={() => handleZoneClick('REAR')}
            className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-12 rounded-xl flex items-center justify-center gap-1 text-xs font-bold transition-transform active:scale-95 ${
              getDamagesForZone('REAR').length > 0
                ? 'bg-rose-600/80 text-white border-2 border-rose-400 animate-pulse'
                : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-500/30'
            }`}
          >
            <span>ARRIÈRE</span>
            {getDamagesForZone('REAR').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {getDamagesForZone('REAR').length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Wheels button */}
        <div className="flex gap-2 w-full mt-3">
          <button
            type="button"
            onClick={() => handleZoneClick('WHEELS')}
            className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 border ${
              getDamagesForZone('WHEELS').length > 0
                ? 'bg-rose-600/80 text-white border-rose-400'
                : 'bg-[#1A2338] text-slate-300 border-slate-700'
            }`}
          >
            <span>Jantes & Pneus</span>
            {getDamagesForZone('WHEELS').length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[10px] font-bold">
                {getDamagesForZone('WHEELS').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Damages List Section */}
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Dommages inventoriés ({damages.length})
        </span>

        {damages.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#0A0E1A] border border-slate-800 text-center">
            <span className="text-sm text-emerald-400 font-semibold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Aucun dommage signalé sur ce véhicule
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {damages.map(damage => (
              <div
                key={damage.id}
                className="p-3 rounded-2xl bg-[#0A0E1A] border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${
                      damage.severity === 'HIGH'
                        ? 'bg-rose-500'
                        : damage.severity === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-yellow-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {ZONE_NAMES[damage.zone]}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {DAMAGE_TYPE_NAMES[damage.type]}
                      </span>
                      {damage.isPreExisting && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">
                          Pré-existant
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{damage.description}</p>
                    {damage.estimatedCost && damage.estimatedCost > 0 && (
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        Coût estimé : ~{damage.estimatedCost.toFixed(2)} DT
                      </span>
                    )}
                  </div>
                </div>

                {!readOnly && onRemoveDamage && (
                  <button
                    type="button"
                    onClick={() => onRemoveDamage(damage.id)}
                    className="w-10 h-10 min-w-[40px] rounded-xl bg-slate-800/80 text-rose-400 flex items-center justify-center active:scale-90"
                    aria-label="Supprimer le dommage"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to add damage on selected zone */}
      {activeModal && selectedZone && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                  Signalement dommage
                </span>
                <h4 className="text-lg font-bold text-white">{ZONE_NAMES[selectedZone]}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(false)}
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300">Type de dégradation</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DAMAGE_TYPE_NAMES) as DamageType[]).map(typeKey => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setNewType(typeKey)}
                    className={`min-h-[48px] px-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      newType === typeKey
                        ? 'bg-blue-600/30 border-blue-500 text-white'
                        : 'bg-[#1A2338] border-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{DAMAGE_TYPE_NAMES[typeKey]}</span>
                    {newType === typeKey && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300">Gravité du constat</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'LOW', label: 'Légère', color: 'text-yellow-400', border: 'border-yellow-500/50' },
                  { key: 'MEDIUM', label: 'Moyenne', color: 'text-amber-400', border: 'border-amber-500/50' },
                  { key: 'HIGH', label: 'Importante', color: 'text-rose-400', border: 'border-rose-500/50' },
                ].map(sev => (
                  <button
                    key={sev.key}
                    type="button"
                    onClick={() => setNewSeverity(sev.key as DamageSeverity)}
                    className={`min-h-[48px] rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                      newSeverity === sev.key
                        ? `bg-slate-800 ${sev.border} ${sev.color}`
                        : 'bg-[#1A2338] border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${sev.color.replace('text', 'bg')}`} />
                    <span>{sev.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description input */}
            <TactileInput
              label="Description précise"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Ex: Rayure 5cm sur aile avant gauche..."
            />

            {/* Estimated cost input */}
            <TactileInput
              label="Estimation forfaitaire réparation (DT)"
              numericMode
              value={newEstimatedCost.toString()}
              onChange={e => setNewEstimatedCost(Number(e.target.value) || 0)}
              suffix="DT"
            />

            {/* Optional Photo */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Photo justificative du dommage (Recommandé)</span>
              </label>
              {newPhotoUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-32">
                  <img src={newPhotoUrl} alt="Dommage" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewPhotoUrl('')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setNewPhotoUrl(
                      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80'
                    )
                  }
                  className="min-h-[56px] rounded-2xl bg-[#1A2338] border border-dashed border-slate-600 text-blue-400 text-sm font-semibold flex items-center justify-center gap-2 active:scale-98"
                >
                  <Camera className="w-5 h-5" />
                  <span>Prendre / Joindre photo du dommage</span>
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <TactileButton
                variant="outline"
                className="flex-1"
                onClick={() => setActiveModal(false)}
              >
                Annuler
              </TactileButton>
              <TactileButton
                variant="primary"
                className="flex-1"
                icon={Plus}
                onClick={handleSaveDamage}
              >
                Enregistrer
              </TactileButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
