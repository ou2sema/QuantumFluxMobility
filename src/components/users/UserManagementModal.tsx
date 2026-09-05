import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { User, UserRole } from '../../types';
import {
  X,
  UserPlus,
  ShieldCheck,
  Users,
  Wrench,
  KeyRound,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Phone,
  Mail,
  Shield,
  BadgeCheck,
  Camera,
  Upload,
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { PhotoUploadCaptureModal } from '../ui/PhotoUploadCaptureModal';

interface UserManagementModalProps {
  onClose: () => void;
}

const ROLE_OPTIONS: { role: UserRole; title: string; desc: string; badgeColor: string; icon: any }[] = [
  {
    role: 'ADMIN',
    title: 'Administrateur',
    desc: 'Accès complet au système, gestion de flotte, finance et ajout d\'utilisateurs',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: ShieldCheck,
  },
  {
    role: 'AGENT_COMPTOIR',
    title: 'Agent de Comptoir',
    desc: 'Gestion des réservations, remise & retour de clés (Check-in / Out), statut et ajout de clients',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: Users,
  },
  {
    role: 'AGENT_TECHNIQUE',
    title: 'Agent Technique',
    desc: 'Gestion atelier, statut maintenance, suivi des vidanges, plaquettes de frein & révisions',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Wrench,
  },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { users, addUser, updateUser, deleteUser, currentUser, currentAgency } = useApp();
  const { isAdmin } = useAuth();

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserAvatar, setNewUserAvatar] = useState<string>('');
  const [targetPhotoUserId, setTargetPhotoUserId] = useState<string | null>(null);
  const [showUserPhotoModal, setShowUserPhotoModal] = useState(false);

  // Add User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('AGENT_COMPTOIR');
  const [pinCode, setPinCode] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit PIN State
  const [tempPin, setTempPin] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Le nom de l\'utilisateur est obligatoire.');
      return;
    }
    if (!pinCode.trim() || pinCode.length < 4) {
      setFormError('Le code PIN doit comporter au moins 4 chiffres.');
      return;
    }
    if (!/^\d+$/.test(pinCode)) {
      setFormError('Le code PIN doit contenir uniquement des chiffres.');
      return;
    }

    addUser({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@autofleet.fr`,
      phone: phone.trim() || '+33 6 00 00 00 00',
      role,
      pinCode: pinCode.trim(),
      agencyId: currentAgency.id,
      jobTitle: jobTitle.trim() || ROLE_OPTIONS.find(r => r.role === role)?.title,
      avatarUrl: newUserAvatar.trim() || undefined,
      active: true,
    });

    // Reset
    setName('');
    setEmail('');
    setPhone('');
    setPinCode('');
    setJobTitle('');
    setNewUserAvatar('');
    setFormError(null);
    setIsAddingUser(false);
  };

  const handleSavePin = (userId: string) => {
    if (!tempPin || tempPin.length < 4 || !/^\d+$/.test(tempPin)) {
      alert('Le code PIN doit comporter au moins 4 chiffres.');
      return;
    }
    updateUser(userId, { pinCode: tempPin });
    setEditingUserId(null);
    setTempPin('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#10162A] border border-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#151B30] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Gestion des Utilisateurs & Codes PIN</h3>
              <p className="text-xs text-gray-400">Contrôle des accès des 3 groupes de collaborateurs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0A0E1A] border border-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Top Info Banner */}
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-3 text-xs text-blue-200">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Politique de sécurité des 3 Rôles :</span>
              <ul className="mt-1 space-y-0.5 text-gray-300">
                <li>• <strong className="text-purple-300">Admin :</strong> Accès illimité + création et configuration des utilisateurs.</li>
                <li>• <strong className="text-emerald-300">Agent de Comptoir :</strong> Réservations, Check-in / Check-out, statuts des véhicules, ajout de clients.</li>
                <li>• <strong className="text-amber-300">Agent Technique :</strong> Flotte, statut maintenance, planification et réalisation des vidanges et plaquettes.</li>
              </ul>
            </div>
          </div>

          {/* Action Header: Add user button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider">
              Collaborateurs Enregistrés ({users.length})
            </span>
            {!isAddingUser && (
              <TactileButton
                variant="primary"
                onClick={() => setIsAddingUser(true)}
                className="text-xs h-9 px-3 gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ajouter un Utilisateur</span>
              </TactileButton>
            )}
          </div>

          {/* Add User Form Drawer */}
          {isAddingUser && (
            <form onSubmit={handleCreateUser} className="bg-[#151B30] border border-blue-500/40 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  Nouveau Collaborateur
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingUser(false);
                    setFormError(null);
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Annuler
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Profile Photo Selector for New User */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0A0E1A] border border-gray-800">
                <div
                  onClick={() => {
                    setTargetPhotoUserId('NEW_USER');
                    setShowUserPhotoModal(true);
                  }}
                  className="relative group cursor-pointer flex-shrink-0"
                  title="Ajouter une photo de profil (caméra ou appareil)"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800 border-2 border-dashed border-blue-500/60 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {newUserAvatar ? (
                      <img src={newUserAvatar} alt="Photo" className="w-full h-full object-cover" />
                    ) : name.trim() ? (
                      name.trim().charAt(0).toUpperCase()
                    ) : (
                      <Users className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-4 h-4 text-blue-300" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Camera className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1">
                  <span className="text-xs font-bold text-white block">Photo de profil du collaborateur</span>
                  <span className="text-[11px] text-gray-400 block mb-1.5">
                    {newUserAvatar ? 'Photo configurée avec succès' : 'Facultatif - caméra ou fichier'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetPhotoUserId('NEW_USER');
                        setShowUserPhotoModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{newUserAvatar ? 'Changer la photo' : 'Prendre ou importer'}</span>
                    </button>
                    {newUserAvatar && (
                      <button
                        type="button"
                        onClick={() => setNewUserAvatar('')}
                        className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs cursor-pointer"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-300 font-medium">Nom complet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Yassine Mansour"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-[#0A0E1A] border border-gray-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-300 font-medium">Code PIN d'accès (4 chiffres) *</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="••••"
                    value={pinCode}
                    onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                    className="h-10 px-3 rounded-xl bg-[#0A0E1A] border border-gray-700 text-white font-mono font-bold text-base tracking-widest focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-300 font-medium">Email professionnel</label>
                  <input
                    type="email"
                    placeholder="agent@autofleet.fr"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-[#0A0E1A] border border-gray-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-300 font-medium">Numéro de téléphone</label>
                  <input
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-[#0A0E1A] border border-gray-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-300 font-medium">Groupe / Rôle d'accès *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map(opt => {
                    const isSelected = role === opt.role;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => setRole(opt.role)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500'
                            : 'bg-[#0A0E1A] border-gray-800 hover:border-gray-700 text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                          <span className="text-xs font-bold text-white">{opt.title}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 leading-snug line-clamp-2">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <TactileButton
                  variant="outline"
                  onClick={() => setIsAddingUser(false)}
                  className="text-xs h-9"
                >
                  Annuler
                </TactileButton>
                <TactileButton
                  type="submit"
                  variant="primary"
                  className="text-xs h-9 px-4"
                >
                  Enregistrer l'utilisateur
                </TactileButton>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="flex flex-col gap-2.5">
            {users.map(u => {
              const meta = ROLE_OPTIONS.find(r => r.role === u.role) || ROLE_OPTIONS[0];
              const Icon = meta.icon;
              const isEditingThisPin = editingUserId === u.id;
              const isCurrentUser = currentUser.id === u.id;

              return (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl bg-[#151B30] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Clickable user avatar to update photo */}
                    <div
                      onClick={() => {
                        setTargetPhotoUserId(u.id);
                        setShowUserPhotoModal(true);
                      }}
                      className="relative group cursor-pointer flex-shrink-0"
                      title="Changer la photo de profil (caméra ou fichier)"
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-700 border-2 border-blue-500/60 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name.charAt(0)
                        )}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Camera className="w-4 h-4 text-blue-300" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Camera className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{u.name}</span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Vous
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-gray-500" />
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-gray-500" />
                            {u.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Role badge & PIN management */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase font-mono border flex items-center gap-1 ${meta.badgeColor}`}>
                      <Icon className="w-3 h-3" />
                      <span>{meta.title}</span>
                    </span>

                    {/* PIN Code Security Box - Strictly Masked */}
                    <div className="flex items-center gap-2 bg-[#0A0E1A] px-2.5 py-1 rounded-xl border border-gray-800">
                      <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                      {isEditingThisPin ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="password"
                            maxLength={6}
                            value={tempPin}
                            onChange={e => setTempPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="Nouveau PIN"
                            className="w-24 h-6 px-1.5 text-center font-mono font-bold text-xs bg-gray-900 border border-blue-500 text-white rounded focus:outline-none tracking-widest"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePin(u.id)}
                            className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                            title="Sauvegarder le code PIN"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(null);
                              setTempPin('');
                            }}
                            className="p-1 rounded bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                            title="Annuler"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-400 tracking-widest">
                            ••••
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setTempPin('');
                            }}
                            className="text-gray-400 hover:text-blue-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                            title="Modifier le code PIN"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Modifier</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete user button (disabled for self) */}
                    {users.length > 1 && !isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Voulez-vous vraiment supprimer l'utilisateur ${u.name} ?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#151B30] border-t border-gray-800 flex justify-end">
          <TactileButton variant="primary" onClick={onClose} className="px-5">
            Fermer
          </TactileButton>
        </div>
      </div>

      {/* Profile Photo Upload & Capture Modal */}
      {showUserPhotoModal && (
        <PhotoUploadCaptureModal
          isOpen={showUserPhotoModal}
          onClose={() => {
            setShowUserPhotoModal(false);
            setTargetPhotoUserId(null);
          }}
          onPhotoSelected={(newUrl) => {
            if (targetPhotoUserId === 'NEW_USER') {
              setNewUserAvatar(newUrl);
            } else if (targetPhotoUserId) {
              updateUser(targetPhotoUserId, { avatarUrl: newUrl });
            }
          }}
          title={
            targetPhotoUserId === 'NEW_USER'
              ? 'Photo du nouveau collaborateur'
              : `Photo de ${users.find(u => u.id === targetPhotoUserId)?.name || 'l\'utilisateur'}`
          }
          subtitle="Prenez une photo en direct ou importez une photo depuis votre appareil"
          aspectRatio="square"
          defaultFacingMode="user"
          currentPhotoUrl={
            targetPhotoUserId === 'NEW_USER'
              ? newUserAvatar
              : users.find(u => u.id === targetPhotoUserId)?.avatarUrl
          }
        />
      )}
    </div>
  );
};
