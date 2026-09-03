import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { QuantumFluxLogo } from '../ui/QuantumFluxLogo';
import { EditAgencyModal } from '../modals/EditAgencyModal';
import { FirestoreSyncModal } from '../modals/FirestoreSyncModal';
import { PinLockScreen } from '../auth/PinLockScreen';
import { UserManagementModal } from '../users/UserManagementModal';
import {
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  UserCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  CheckCheck,
  Trash2,
  ArrowRight,
  Check,
  Edit,
  Lock,
  KeyRound,
  UserPlus,
  Users,
  Wrench,
  ShieldCheck,
  Database,
} from 'lucide-react';

const ROLE_LABELS: Record<UserRole, { title: string; subtitle: string; color: string; icon: any }> = {
  ADMIN: {
    title: 'Administrateur',
    subtitle: 'Accès total & gestion utilisateurs',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: ShieldCheck,
  },
  AGENT_COMPTOIR: {
    title: 'Agent de Comptoir',
    subtitle: 'Réservations, Check-in/out & Clients',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: Users,
  },
  AGENT_TECHNIQUE: {
    title: 'Agent Technique',
    subtitle: 'Flotte, vidanges, plaquettes & atelier',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: Wrench,
  },
};

export const TopNavBar: React.FC = () => {
  const {
    currentUser,
    users,
    currentAgency,
    agencies,
    setCurrentAgency,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    isOffline,
    isFirestoreConnected,
    setIsOffline,
    pendingSyncCount,
    triggerSync,
    setActiveTab,
    setSelectedBookingForCheckIn,
    setSelectedBookingForCheckOut,
    bookings,
  } = useApp();

  const { isAdmin, isAgentTechnique, isAgentComptoir } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showEditAgencyModal, setShowEditAgencyModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalTargetUser, setPinModalTargetUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showFirestoreModal, setShowFirestoreModal] = useState(false);

  const handleRequestSwitchUser = (targetUser: any) => {
    if (targetUser.id === currentUser.id) {
      setShowRoleMenu(false);
      return;
    }
    setShowRoleMenu(false);
    setPinModalTargetUser(targetUser);
    setShowPinModal(true);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    setShowNotifDrawer(false);
    if (notif.targetId) {
      if (notif.type === 'CHECKIN_DUE') {
        const bk = bookings.find(b => b.id === notif.targetId);
        if (bk) {
          setSelectedBookingForCheckIn(bk);
          setActiveTab('checkin');
        }
      } else if (notif.type === 'CHECKOUT_DUE') {
        const bk = bookings.find(b => b.id === notif.targetId);
        if (bk) {
          setSelectedBookingForCheckOut(bk);
          setActiveTab('checkout');
        }
      } else if (notif.type === 'LICENSE_EXPIRING') {
        setActiveTab('clients');
      } else if (notif.type === 'MAINTENANCE_DUE') {
        setActiveTab('maintenance');
      }
    }
  };

  const currentRoleInfo = ROLE_LABELS[currentUser.role] || ROLE_LABELS.ADMIN;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0D1224] border-b border-gray-800 px-3 sm:px-6 py-2.5 sm:py-3 pt-safe select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand & Agency Selector */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <QuantumFluxLogo variant="horizontal" size="md" showSubtitle={false} />
            <button
              type="button"
              onClick={() => setShowEditAgencyModal(true)}
              className="hidden lg:flex items-center gap-2 pl-3 py-1 px-2.5 rounded-lg border border-transparent hover:border-gray-800 hover:bg-[#151B30] text-left transition-all cursor-pointer group"
              title="Cliquer pour modifier ou changer l'agence (Admin)"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="truncate max-w-[180px] font-bold text-gray-200">
                    {currentAgency.name}
                  </span>
                  {isAdmin && (
                    <span className="px-1 py-0.2 rounded text-[8px] bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 flex items-center gap-0.5">
                      <Edit className="w-2.5 h-2.5" />
                      <span>Éditer</span>
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-gray-500 font-mono">
                  {currentAgency.city} • {currentAgency.openHours}
                </span>
              </div>
            </button>
          </div>

          {/* Right actions: Offline/Online, Notifications, Profile & Role Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Firestore Cloud Status Badge & Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowFirestoreModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 text-[11px] font-mono transition-all active:scale-95 cursor-pointer"
              title="Gérer la synchronisation et forcer le transfert vers Firestore"
            >
              <Database className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-bold">Firestore Sync</span>
            </button>

            {/* Offline Simulation Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isOffline) {
                  setIsOffline(false);
                  triggerSync();
                } else {
                  setIsOffline(true);
                }
              }}
              className={`min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all duration-150 active:scale-95 cursor-pointer ${
                isOffline
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300 animate-pulse'
                  : 'bg-[#151B30] border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
              title="Basculer le mode Hors-Ligne"
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-4 h-4 text-orange-400" />
                  <span className="hidden md:inline">Hors-ligne</span>
                  {pendingSyncCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-orange-500 text-black font-black text-[10px]">
                      {pendingSyncCount}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="hidden md:inline text-green-400 font-mono text-[11px]">En Ligne</span>
                </>
              )}
            </button>

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => setShowNotifDrawer(true)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#151B30] border border-gray-800 text-gray-300 hover:text-white flex items-center justify-center relative active:scale-90 transition-transform cursor-pointer"
              aria-label="Alertes et notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center border-2 border-[#0D1224]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Active User Profile & Role Switcher - ALWAYS fully visible on mobile */}
            <button
              id="top-profile-button"
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="min-h-[40px] sm:min-h-[44px] pl-1.5 sm:pl-3 pr-1.5 sm:pr-2.5 py-1 rounded-xl bg-[#151B30] border border-gray-800 flex items-center gap-2 sm:gap-2.5 text-left active:scale-95 transition-transform hover:border-gray-700 flex-shrink-0 cursor-pointer"
              title="Profil et changement d'utilisateur (PIN)"
              aria-label="Menu profil utilisateur"
            >
              {/* Text labels hidden on small screens to prevent layout squishing */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-tight">
                  {currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'AGENT_COMPTOIR' ? 'Comptoir' : 'Technique'}
                </span>
              </div>

              {/* Profile Avatar Icon Container: Visible everywhere, styled with glowing status border */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-700 border-2 border-blue-500 overflow-hidden flex items-center justify-center font-bold text-white text-xs shadow-md">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                {/* Active online green dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#151B30]" />
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </button>
          </div>
        </div>
      </header>

      {/* Role Switcher & User Profile Menu Drawer */}
      {showRoleMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-end p-3 sm:p-4 pt-16"
          onClick={() => setShowRoleMenu(false)}
        >
          <div
            className="w-full max-w-sm bg-[#151B30] border border-gray-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            {/* User Profile Summary */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 border-2 border-blue-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{currentUser.name}</h4>
                  <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold border ${currentRoleInfo.color}`}>
                      {currentRoleInfo.title}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRoleMenu(false)}
                className="w-8 h-8 rounded-lg bg-[#0A0E1A] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions: Authenticate with PIN / Manage Users */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRoleMenu(false);
                  setShowPinModal(true);
                }}
                className="w-full h-10 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>Changer d'utilisateur (Code PIN)</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    setShowUserModal(true);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Gestion des Utilisateurs & PINs (Admin)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowRoleMenu(false);
                  useApp().lockApp();
                }}
                className="w-full h-10 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Verrouiller l'écran avec code PIN</span>
              </button>
            </div>

            {/* User Profiles Switcher with mandatory PIN */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                  Changer de Collaborateur :
                </span>
                <span className="text-[9px] text-cyan-400 font-mono font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Code PIN obligatoire
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                {users.map(u => {
                  const isSelected = currentUser.id === u.id;
                  const info = ROLE_LABELS[u.role] || ROLE_LABELS.ADMIN;
                  const Icon = info.icon;

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleRequestSwitchUser(u)}
                      className={`p-2.5 rounded-2xl text-left border flex items-center justify-between transition-all active:scale-98 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-[#0A0E1A] border-gray-800 text-gray-300 hover:border-blue-500/50 hover:bg-[#11172e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border overflow-hidden ${info.color}`}>
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-[#0A0E1A]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate">{u.name}</p>
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
                                Actif
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block truncate">
                            {info.title} {u.jobTitle ? `• ${u.jobTitle}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {isSelected ? (
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-800/80 text-[10px] font-mono text-gray-400 border border-gray-700">
                            <Lock className="w-3 h-3 text-cyan-400" />
                            <span>PIN</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-end p-3 pt-16"
          onClick={() => setShowNotifDrawer(false)}
        >
          <div
            className="w-full max-w-sm bg-[#151B30] border border-gray-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with counter and mark all read */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Notifications</h4>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsAsRead()}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-400 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tout lire</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotifDrawer(false)}
                  className="w-7 h-7 rounded-lg bg-[#0A0E1A] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification items list */}
            <div className="flex flex-col gap-2.5">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                  <Bell className="w-6 h-6 opacity-30" />
                  <p>Aucune notification pour le moment.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      // Clicking on the card marks it as read immediately and decrements unreadCount
                      if (!notif.read) {
                        markNotificationAsRead(notif.id);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      !notif.read
                        ? 'bg-[#0E172C] border-cyan-500/40 shadow-lg ring-1 ring-cyan-500/20'
                        : 'bg-[#0A0E1A]/80 border-gray-800 text-gray-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {notif.severity === 'ALERT' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        )}
                        {notif.severity === 'WARNING' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                        )}
                        {notif.severity === 'INFO' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold text-white truncate">{notif.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!notif.read && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                            Non lu
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">{notif.time}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">{notif.message}</p>

                    {/* Actions bar at bottom of notification item */}
                    <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {!notif.read ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(notif.id);
                            }}
                            className="px-2 py-1 rounded bg-gray-800/80 hover:bg-gray-700 text-cyan-400 text-[10px] font-bold flex items-center gap-1 border border-gray-700 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Marquer comme lu</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            <CheckCheck className="w-3 h-3 text-gray-600" />
                            <span>Déjà lu</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {notif.targetId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif);
                            }}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <span>Ouvrir</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Supprimer la notification"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Agency Title & Settings Modal for Admin */}
      {showEditAgencyModal && (
        <EditAgencyModal onClose={() => setShowEditAgencyModal(false)} />
      )}

      {/* PIN Authentication Modal / Switch User */}
      {showPinModal && (
        <PinLockScreen
          isModal={true}
          mandatory={false}
          targetUser={pinModalTargetUser}
          title={pinModalTargetUser ? `Authentification requise - ${pinModalTargetUser.name}` : "Changement d'utilisateur"}
          subtitle={pinModalTargetUser ? `Saisissez le code PIN de ${pinModalTargetUser.name} pour basculer vers ce compte` : "Sélectionnez un profil et saisissez son code PIN"}
          onCloseModal={() => {
            setShowPinModal(false);
            setPinModalTargetUser(null);
          }}
          onUnlocked={() => {
            setShowPinModal(false);
            if (pinModalTargetUser?.role === 'AGENT_TECHNIQUE') {
              setActiveTab('maintenance');
            }
            setPinModalTargetUser(null);
          }}
        />
      )}

      {/* User Management & PINs Modal for Admin */}
      {showUserModal && (
        <UserManagementModal onClose={() => setShowUserModal(false)} />
      )}

      {/* Cloud Firestore Sync & Management Modal */}
      {showFirestoreModal && (
        <FirestoreSyncModal onClose={() => setShowFirestoreModal(false)} />
      )}
    </>
  );
};
