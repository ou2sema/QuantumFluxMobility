import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuantumFluxLogo } from './ui/QuantumFluxLogo';
import { Sparkles, ShieldCheck, Wifi, Zap } from 'lucide-react';

interface MobileSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const MobileSplashScreen: React.FC<MobileSplashScreenProps> = ({
  onFinish,
  minDurationMs = 2400,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initialisation de QuantumFlux...');

  useEffect(() => {
    // Stepped progression simulation for smooth tactile feedback
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Synchronisation de la flotte...');
    }, 600);

    const t2 = setTimeout(() => {
      setProgress(80);
      setStatusText('Chargement des protocoles hors-ligne...');
    }, 1300);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Prêt pour la mobilité');
    }, 1900);

    const t4 = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) {
        onFinish();
      }
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [minDurationMs, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="quantumflux-mobile-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#070A14] text-white select-none overflow-hidden touch-none"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 2.5rem)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)',
          }}
        >
          {/* Subtle Ambient Radial Lighting & Cyber-grid Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.35, scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-[15%] -left-[10%] w-[130%] h-[65%] bg-gradient-to-b from-cyan-600/30 via-blue-700/15 to-transparent rounded-full blur-3xl"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(14,165,233,0.12)_0%,rgba(7,10,20,0.95)_75%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#070A14] to-transparent" />
          </div>

          {/* Top Status Indicators (Enterprise Grade) */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative z-10 flex items-center justify-between w-full max-w-sm px-6"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-300 uppercase">
                Enterprise PWA
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sécurisé</span>
              </span>
            </div>
          </motion.div>

          {/* Center Brand Hero: 3D Emblem with Energetic Entrance */}
          <div className="relative z-10 flex flex-col items-center justify-center px-4 -mt-6">
            {/* Pulsing Concentric Aura */}
            <div className="relative flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.45, 0.2] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-36 h-36 rounded-3xl bg-cyan-500/20 blur-xl pointer-events-none"
              />

              <motion.div
                initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: 0.15,
                }}
                className="relative"
              >
                <QuantumFluxLogo variant="icon" size="xl" />
              </motion.div>
            </div>

            {/* Typography Entrance */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 flex flex-col items-center text-center"
            >
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 drop-shadow-sm font-sans">
                  QUANTUM<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">FLUX</span>
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-700/60 shadow-sm shadow-cyan-900/30">
                  MOBILITY
                </span>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="text-xs sm:text-sm font-medium tracking-[0.08em] text-slate-400 mt-2 uppercase font-sans"
              >
                Système Haute Performance de Mobilité
              </motion.p>
            </motion.div>
          </div>

          {/* Bottom Progress & Dynamic Status System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative z-10 w-full max-w-xs px-4 flex flex-col items-center"
          >
            {/* Dynamic Status Text */}
            <div className="w-full flex items-center justify-between text-xs font-mono mb-2 px-0.5">
              <span className="text-slate-400 text-[11px] truncate flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
                {statusText}
              </span>
              <span className="text-cyan-400 font-bold text-[11px] tabular-nums">
                {progress}%
              </span>
            </div>

            {/* Custom Glowing Progress Bar */}
            <div className="w-full h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/80 p-0.5 relative shadow-inner">
              <motion.div
                initial={{ width: '10%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              />
            </div>

            {/* Micro Badge Footer */}
            <div className="mt-4 flex items-center gap-3 text-[10px] text-slate-500 font-mono tracking-wider">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400/70" />
                v2.4
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-cyan-400/70" />
                Hors-ligne Ready
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
