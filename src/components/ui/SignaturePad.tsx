import React from 'react';
import { useSignature } from '../../hooks/useSignature';
import { RotateCcw, PenTool, CheckCircle2 } from 'lucide-react';
import { TactileButton } from './TactileButton';

interface SignaturePadProps {
  onConfirmSignature: (dataUrl: string) => void;
  clientName: string;
  type?: 'CHECK_IN' | 'CHECK_OUT';
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onConfirmSignature,
  clientName,
  type = 'CHECK_IN',
}) => {
  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    getSignatureDataUrl,
    hasSigned,
  } = useSignature();

  const handleConfirm = () => {
    const dataUrl = getSignatureDataUrl();
    if (dataUrl) {
      onConfirmSignature(dataUrl);
    }
  };

  return (
    <div className="w-full bg-[#10172A] rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Signature Client
            </span>
            <h4 className="text-base font-extrabold text-white">{clientName}</h4>
          </div>
        </div>

        <button
          type="button"
          onClick={clearSignature}
          className="min-h-[44px] px-3.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold active:scale-95 transition-transform"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Effacer</span>
        </button>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-52 bg-[#0A0E1A] rounded-2xl border-2 border-dashed border-slate-700 overflow-hidden touch-none flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={210}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasSigned && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-500 text-sm font-medium gap-2">
            <PenTool className="w-8 h-8 opacity-40 animate-pulse" />
            <span>Signez ici avec le doigt ou un stylet</span>
          </div>
        )}

        {/* Base line marker */}
        <div className="absolute bottom-8 left-8 right-8 border-b border-slate-700/60 pointer-events-none flex justify-between text-[10px] text-slate-600 font-mono">
          <span>X SIGNATURE DU CONDUCTEUR</span>
          <span>DATE : {new Date().toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Legal terms disclaimer */}
      <p className="text-[11px] text-slate-400 leading-relaxed bg-[#0A0E1A] p-3 rounded-xl border border-slate-800">
        {type === 'CHECK_IN'
          ? 'En signant, le locataire reconnaît l’exactitude de l’état des lieux de départ, le kilométrage et le niveau de carburant indiqués ci-dessus, et accepte les conditions générales de location.'
          : 'En signant, le locataire valide la restitution du véhicule, le solde des éventuels kilomètres supplémentaires ou carburant manquant, et la restitution de la caution correspondante.'}
      </p>

      {/* Validation Action */}
      <TactileButton
        variant="primary"
        fullWidth
        disabled={!hasSigned}
        icon={CheckCircle2}
        onClick={handleConfirm}
      >
        Valider et Enregistrer la Signature
      </TactileButton>
    </div>
  );
};
