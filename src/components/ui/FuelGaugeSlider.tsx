import React from 'react';
import { Fuel, Zap } from 'lucide-react';
import { FuelType } from '../../types';

interface FuelGaugeSliderProps {
  value: number; // 0 to 100
  onChange: (val: number) => void;
  fuelType?: FuelType;
  tankCapacity?: number; // Liters or kWh
  readOnly?: boolean;
}

export const FuelGaugeSlider: React.FC<FuelGaugeSliderProps> = ({
  value,
  onChange,
  fuelType = 'ESSENCE',
  tankCapacity = 45,
  readOnly = false,
}) => {
  const isElectric = fuelType === 'ELECTRIQUE';
  const calculatedUnits = ((value / 100) * tankCapacity).toFixed(1);

  // Determine color based on fuel level
  const getColor = () => {
    if (value < 20) return 'text-rose-400 bg-rose-500';
    if (value < 50) return 'text-amber-400 bg-amber-500';
    return isElectric ? 'text-emerald-400 bg-emerald-500' : 'text-blue-400 bg-blue-500';
  };

  const colorClasses = getColor();

  const presets = [
    { label: 'Vide (0%)', val: 0 },
    { label: '1/4 (25%)', val: 25 },
    { label: '1/2 (50%)', val: 50 },
    { label: '3/4 (75%)', val: 75 },
    { label: 'Plein (100%)', val: 100 },
  ];

  return (
    <div className="w-full bg-[#10172A] rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isElectric ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {isElectric ? <Zap className="w-5 h-5" /> : <Fuel className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isElectric ? 'Niveau de Batterie' : 'Jauge de Carburant'}
            </span>
            <h4 className="text-base font-extrabold text-white">
              {fuelType} ({tankCapacity} {isElectric ? 'kWh' : 'L'})
            </h4>
          </div>
        </div>

        {/* Big percentage & volume readout */}
        <div className="text-right">
          <span className="text-3xl font-black font-mono text-white tracking-tight">
            {value}%
          </span>
          <p className="text-xs font-mono font-semibold text-slate-400">
            ~ {calculatedUnits} {isElectric ? 'kWh' : 'Litres'}
          </p>
        </div>
      </div>

      {/* Visual gauge progress bar */}
      <div className="relative w-full h-8 bg-[#0A0E1A] rounded-2xl p-1 border border-slate-700/80 overflow-hidden flex items-center">
        <div
          className={`h-full rounded-xl transition-all duration-150 ${colorClasses.split(' ')[1]}`}
          style={{ width: `${value}%` }}
        />
        {/* Tick marks */}
        <div className="absolute inset-0 flex justify-between px-3 items-center pointer-events-none">
          <span className="w-0.5 h-3 bg-white/40" />
          <span className="w-0.5 h-2 bg-white/30" />
          <span className="w-0.5 h-4 bg-white/50" />
          <span className="w-0.5 h-2 bg-white/30" />
          <span className="w-0.5 h-3 bg-white/40" />
        </div>
      </div>

      {/* Tactile Range Slider Input */}
      {!readOnly && (
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-8 appearance-none bg-transparent cursor-pointer accent-blue-500"
            aria-label="Ajuster niveau carburant"
          />

          {/* Direct tactile preset buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {presets.map(preset => (
              <button
                key={preset.val}
                type="button"
                onClick={() => onChange(preset.val)}
                className={`min-h-[44px] rounded-xl text-xs font-bold font-mono transition-all border ${
                  value === preset.val
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md scale-105'
                    : 'bg-[#1A2338] text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {preset.val}%
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
