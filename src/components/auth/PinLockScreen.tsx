import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import {
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Delete,
  RotateCcw,
  Sparkles,
  Wrench,
  Users
} from 'lucide-react';
import { QuantumFluxLogo } from '../ui/QuantumFluxLogo';

interface PinLockScreenProps {
  onUnlocked?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
  targetUser?: User | null;
  title?: string;
  subtitle?: string;
  mandatory?: boolean;
}

const ROLE_INFO: Record<UserRole, { label: string; desc: string; color: string; icon: any }> = {
  ADMIN: {
    label: 'Administrateur',
    desc: 'Accès complet & gestion des utilisateurs',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: ShieldCheck,
  },
  AGENT_COMPTOIR: {
    label: 'Agent de Comptoir',
    desc: 'Réservations, check-in/out, clients & statuts',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Users,
  },
  AGENT_TECHNIQUE: {
    label: 'Agent Technique',
    desc: 'Flotte, vidanges, plaquettes & maintenance',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Wrench,
  },
};

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  onUnlocked,
  isModal = false,
  onCloseModal,
  targetUser,
  title,
  subtitle,
  mandatory = false,
}) => {
  const { users, currentUser, unlockWithPin, currentAgency } = useApp();
  const [selectedUser, setSelectedUser] = useState<User>(() => {
    if (targetUser) return targetUser;
    if (currentUser) return currentUser;
    return users[0];
  });
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Sync selected user when targetUser prop changes
  useEffect(() => {
    if (targetUser) {
      setSelectedUser(targetUser);
      setPin('');
      setErrorMsg(null);
    }
  }, [targetUser]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 6 || isSuccess) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg(null);

    // Auto submit if reached 4 digits
    if (newPin.length === 4) {
      submitPin(newPin, selectedUser.id);
    }
  };

  const handleDelete = () => {
    if (isSuccess) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    if (isSuccess) return;
    setPin('');
    setErrorMsg(null);
  };

  const submitPin = (pinToTest: string, userId: string) => {
    const ok = unlockWithPin(pinToTest, userId);
    if (ok) {
      setIsSuccess(true);
      setErrorMsg(null);
      setTimeout(() => {
        if (onUnlocked) onUnlocked();
        if (onCloseModal) onCloseModal();
      }, 350);
    } else {
      setErrorMsg('Code PIN incorrect. Veuillez réessayer.');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 500);
    }
  };

  // Physical keyboard listener (numpad and digits 0-9, backspace, esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is focused on an actual form input
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape' && !mandatory && onCloseModal) {
        e.preventDefault();
        onCloseModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, selectedUser, mandatory, onCloseModal, isSuccess]);

  const handleQuickFill = (u: User) => {
    setSelectedUser(u);
    const userPin = u.pinCode || '1111';
    setPin(userPin);
    submitPin(userPin, u.id);
  };

  const roleMeta = ROLE_INFO[selectedUser.role] || ROLE_INFO.ADMIN;
  const RoleIcon = roleMeta.icon;

  const headerTitle =
    title ||
    (targetUser
      ? `Authentification requise - ${selectedUser.name}`
      : 'Authentification Requise');

  const headerSubtitle =
    subtitle ||
    (targetUser
      ? `Entrez le code PIN de ${selectedUser.name} pour basculer vers ce compte`
      : 'Identifiez-vous avec votre code PIN pour accéder à l’application');

  return (
    <div
      className={`${
        isModal
          ? 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto'
          : 'fixed inset-0 z-50 bg-[#0A0E1A] flex items-center justify-center p-3 sm:p-4 overflow-y-auto'
      }`}
      onClick={() => {
        if (!mandatory && onCloseModal) {
          onCloseModal();
        }
      }}
    >
      <div
        className={`w-full max-w-md bg-[#10162A] border border-gray-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center gap-4 sm:gap-5 transition-transform my-auto ${
          shake ? 'animate-bounce' : ''
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-1.5 w-full">
          <QuantumFluxLogo variant="horizontal" size="md" showSubtitle={false} />
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-bold mt-1">
            <Lock className="w-3.5 h-3.5" />
            <span>{headerTitle}</span>
          </div>
          <p className="text-xs text-gray-400 max-w-xs">{headerSubtitle}</p>
        </div>

        {/* User Selector Tabs */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
              Profil à authentifier ({users.length})
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {targetUser ? 'Compte sélectionné' : 'Choisir un profil'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-[#0A0E1A] rounded-2xl border border-gray-800 max-h-36 overflow-y-auto">
            {users.map(u => {
              const isSelected = selectedUser.id === u.id;
              const meta = ROLE_INFO[u.role] || ROLE_INFO.ADMIN;
              const Icon = meta.icon;

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setPin('');
                    setErrorMsg(null);
                  }}
                  className={`min-h-[54px] p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold leading-tight truncate max-w-[90px]">
                      {u.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase font-mono tracking-tighter opacity-80">
                    {u.role === 'ADMIN' ? 'Admin' : u.role === 'AGENT_COMPTOIR' ? 'Comptoir' : 'Technique'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active User Card */}
        <div className="w-full bg-[#151B30] border border-gray-800 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 border-2 border-blue-500 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
            {selectedUser.avatarUrl ? (
              <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-full h-full object-cover" />
            ) : (
              selectedUser.name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{selectedUser.name}</h3>
            <p className="text-xs text-gray-400 truncate">{selectedUser.jobTitle || selectedUser.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${roleMeta.color}`}>
                {roleMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex flex-col items-center gap-2 w-full">
          <span className="text-xs text-gray-300 font-medium">Saisissez votre code PIN (4 chiffres)</span>
          <div className="flex items-center gap-3 my-1">
            {[0, 1, 2, 3].map(idx => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    isFilled
                      ? isSuccess
                        ? 'bg-green-500 scale-125 ring-4 ring-green-500/20'
                        : 'bg-blue-500 scale-125 ring-4 ring-blue-500/20'
                      : 'bg-gray-800 border-2 border-gray-700'
                  }`}
                />
              );
            })}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-bold flex items-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}

          {isSuccess && (
            <p className="text-xs text-green-400 font-bold flex items-center gap-1">
              <Unlock className="w-3.5 h-3.5" />
              Authentification réussie...
            </p>
          )}
        </div>

        {/* Tactile Keypad */}
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-2 sm:gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="min-h-[50px] sm:min-h-[54px] rounded-2xl bg-[#151B30] hover:bg-blue-600/30 border border-gray-800 hover:border-blue-500/50 text-xl font-bold text-white flex items-center justify-center transition-all active:scale-90 active:bg-blue-600 cursor-pointer select-none"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="min-h-[50px] sm:min-h-[54px] rounded-2xl bg-[#151B30] hover:bg-rose-500/20 border border-gray-800 text-gray-400 hover:text-rose-300 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Effacer tout"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="min-h-[50px] sm:min-h-[54px] rounded-2xl bg-[#151B30] hover:bg-blue-600/30 border border-gray-800 hover:border-blue-500/50 text-xl font-bold text-white flex items-center justify-center transition-all active:scale-90 active:bg-blue-600 cursor-pointer select-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="min-h-[50px] sm:min-h-[54px] rounded-2xl bg-[#151B30] hover:bg-gray-700 border border-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Supprimer le dernier chiffre"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Access Chips for reviewers / testing */}
        <div className="w-full pt-3 border-t border-gray-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1 font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Codes PIN configurés :
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center">
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickFill(u)}
                className="px-2.5 py-1 rounded-lg bg-[#0A0E1A] hover:bg-gray-800 border border-gray-700/80 text-[10px] text-gray-300 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
                title={`Cliquer pour tester avec le profil ${u.name}`}
              >
                <span className="font-bold text-blue-400">{u.name.split(' ')[0]}:</span>
                <span className="bg-gray-800 px-1.5 py-0.5 rounded font-black text-amber-300 border border-gray-700">
                  {u.pinCode || '1111'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Close button ONLY if not mandatory (e.g. voluntary user switch) */}
        {!mandatory && isModal && onCloseModal && (
          <button
            type="button"
            onClick={onCloseModal}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors py-1 px-3 rounded-lg hover:bg-gray-800/50 cursor-pointer"
          >
            Annuler sans changer d'utilisateur
          </button>
        )}
      </div>
    </div>
  );
};
