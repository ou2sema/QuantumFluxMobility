import React, { useState, useEffect } from 'react';
import { LicenseOcrResult } from '../../types';
import { useCamera } from '../../hooks/useCamera';
import { Camera, Check, ShieldCheck, AlertTriangle, RefreshCw, X, Sparkles, Scan } from 'lucide-react';
import { TactileButton } from './TactileButton';

interface LicenseScannerModalProps {
  onScanComplete: (result: LicenseOcrResult, photoUrl: string) => void;
  onClose: () => void;
  expectedClientName?: string;
}

export const LicenseScannerModal: React.FC<LicenseScannerModalProps> = ({
  onScanComplete,
  onClose,
  expectedClientName = 'Thomas Vandamme',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<LicenseOcrResult | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const { videoRef, isCameraActive, startCamera, stopCamera, capturePhoto } = useCamera();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const triggerScanOcr = (presetData?: LicenseOcrResult, presetPhoto?: string) => {
    setIsScanning(true);

    const shot = capturePhoto() || presetPhoto || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80';
    setCapturedPhoto(shot);

    setTimeout(() => {
      setIsScanning(false);
      const result: LicenseOcrResult = presetData || {
        number: '24AB910248',
        fullName: expectedClientName,
        expiryDate: '2031-04-12',
        category: 'B, A1',
        isValid: true,
        confidence: 0.98,
      };
      setScannedResult(result);
    }, 1200);
  };

  const handleSimulateExpiredScan = () => {
    triggerScanOcr({
      number: '11DF554890',
      fullName: 'Camille Laurent',
      expiryDate: '2026-09-18', // Expiring in ~16 days
      category: 'B',
      isValid: true,
      confidence: 0.95,
    });
  };

  const handleValidate = () => {
    if (scannedResult) {
      onScanComplete(scannedResult, capturedPhoto);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0E1A] flex flex-col justify-between">
      {/* Header */}
      <div className="pt-safe px-4 py-3 bg-[#10172A] border-b border-slate-800 flex items-center justify-between z-10">
        <div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <Scan className="w-3.5 h-3.5" />
            <span>Vérification d’Identité & Permis</span>
          </span>
          <h3 className="text-base font-extrabold text-white">Scanner Permis de Conduire (OCR)</h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scanner View */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {capturedPhoto ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={capturedPhoto} alt="Permis scanné" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            {/* License Card Frame Guide */}
            <div className="absolute w-[85%] max-w-sm h-52 border-2 border-cyan-400 rounded-2xl shadow-2xl flex flex-col justify-between p-3 bg-cyan-950/20">
              <div className="flex justify-between items-center text-xs font-bold text-cyan-300">
                <span className="px-2 py-0.5 rounded bg-cyan-900/70">PERMIS DE CONDUIRE FR</span>
                <span>CAT. B</span>
              </div>

              {/* Animated laser line */}
              {isScanning && (
                <div className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_#38bdf8] animate-bounce" />
              )}

              <p className="text-center text-xs text-white/90 font-semibold bg-black/60 backdrop-blur-sm py-1 rounded-lg">
                Cadrez le permis dans le rectangle
              </p>
            </div>
          </div>
        )}

        {/* OCR Result Overlay card */}
        {scannedResult && (
          <div className="absolute inset-x-4 bottom-4 bg-[#0F172A]/95 backdrop-blur-md rounded-3xl p-5 border border-slate-700 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase">
                  Reconnaissance OCR Validée ({Math.round(scannedResult.confidence * 100)}%)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">
                {scannedResult.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#0A0E1A] p-3 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Titulaire</span>
                <p className="font-extrabold text-white text-sm truncate">{scannedResult.fullName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">N° Permis</span>
                <p className="font-mono font-extrabold text-cyan-400 text-sm">{scannedResult.number}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Catégories</span>
                <p className="font-bold text-white">{scannedResult.category}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Date Expiration</span>
                <p className={`font-bold font-mono ${scannedResult.expiryDate.startsWith('2026') ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {scannedResult.expiryDate}
                </p>
              </div>
            </div>

            {/* Warning if expiring soon */}
            {scannedResult.expiryDate.startsWith('2026') && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Attention : Ce permis expire dans moins de 30 jours !</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="pb-safe px-4 py-4 bg-[#10172A] border-t border-slate-800 flex flex-col gap-3">
        {!scannedResult ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-center">
              {/* Shutter 72x72 */}
              <button
                type="button"
                onClick={() => triggerScanOcr()}
                disabled={isScanning}
                className="w-[72px] h-[72px] min-w-[72px] min-h-[72px] rounded-full bg-white border-4 border-cyan-500 shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                aria-label="Scanner le permis"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white">
                  <Camera className="w-7 h-7" />
                </div>
              </button>
            </div>

            {/* Quick simulation buttons for rapid testing */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => triggerScanOcr()}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-800 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simuler Permis Valide</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateExpiredScan}
                className="flex-1 min-h-[44px] rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simuler Expiration Proche</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <TactileButton
              variant="outline"
              className="flex-1"
              icon={RefreshCw}
              onClick={() => {
                setScannedResult(null);
                setCapturedPhoto('');
              }}
            >
              Re-scanner
            </TactileButton>

            <TactileButton
              variant="primary"
              className="flex-1"
              icon={Check}
              onClick={handleValidate}
            >
              Confirmer Permis
            </TactileButton>
          </div>
        )}
      </div>
    </div>
  );
};
