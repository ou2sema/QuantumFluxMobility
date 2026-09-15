import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
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
  Search,
  UserCheck,
  UserX,
  Briefcase,
  Building2,
  CheckCircle2,
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
  const { users, addUser, updateUser, deleteUser, resetUserPin, currentUser, currentAgency } = useApp();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserAvatar, setNewUserAvatar] = useState<string>('');
  const [targetPhotoUserId, setTargetPhotoUserId] = useState<string | null>(null);
  const [showUserPhotoModal, setShowUserPhotoModal] = useState(false);

  // Search & Role Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');

  // Edit User State (Full Profile)
  const [editingUserObj, setEditingUserObj] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('AGENT_COMPTOIR');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete User Confirmation State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('AGENT_COMPTOIR');
  const [pinCode, setPinCode] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit PIN State
  const [tempPin, setTempPin] = useState('');

  // Filtered Users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = filterRole === 'ALL' || u.role === filterRole;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(q));
      return matchesRole && matchesSearch;
    });
  }, [users, filterRole, searchQuery]);

  const handleCreateUser = async (e: React.FormEvent) => {
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
    if (/^(\d)\1+$/.test(pinCode) || ['1234', '4321', '0000'].includes(pinCode)) {
      setFormError('Ce code PIN est trop prévisible (ex: 0000, 1111, 1234). Veuillez choisir un code PIN plus sûr.');
      return;
    }

    setIsSubmittingAdd(true);
    setFormError(null);
    try {
      await addUser({
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@autofleet.fr`,
        phone: phone.trim() || '+216 00 000 000',
        role,
        pinCode: pinCode.trim(),
        agencyId: currentAgency.id,
        jobTitle: jobTitle.trim() || ROLE_OPTIONS.find(r => r.role === role)?.title,
        avatarUrl: newUserAvatar.trim() || undefined,
        active: true,
      });

      toast.success(`Collaborateur ${name.trim()} créé avec succès !`, 'Utilisateur ajouté');

      // Reset
      setName('');
      setEmail('');
      setPhone('');
      setPinCode('');
      setJobTitle('');
      setNewUserAvatar('');
      setFormError(null);
      setIsAddingUser(false);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création de l\'utilisateur.');
      toast.error(err.message || 'Impossible de créer l\'utilisateur.', 'Erreur');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUserObj(user);
    setEditName(user.name);
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditJobTitle(user.jobTitle || '');
    setEditActive(user.active !== false);
    setEditError(null);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserObj) return;
    if (!editName.trim()) {
      setEditError('Le nom est requis.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);
    try {
      await updateUser(editingUserObj.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: editRole,
        jobTitle: editJobTitle.trim() || ROLE_OPTIONS.find(r => r.role === editRole)?.title,
        active: editActive,
      });

      toast.success(`Les modifications pour ${editName.trim()} ont été enregistrées !`, 'Utilisateur mis à jour');
      setEditingUserObj(null);
    } catch (err: any) {
      setEditError(err.message || 'Erreur lors de la mise à jour.');
      toast.error(err.message || 'Échec de la modification.', 'Erreur');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleToggleUserActive = async (user: User) => {
    const newStatus = !(user.active !== false);
    try {
      await updateUser(user.id, { active: newStatus });
      toast.info(
        `L'utilisateur ${user.name} est maintenant ${newStatus ? 'actif' : 'inactif'}.`,
        newStatus ? 'Compte réactivé' : 'Compte désactivé'
      );
    } catch (err: any) {
      toast.error('Impossible de changer le statut.', 'Erreur');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      toast.success(`L'utilisateur ${userToDelete.name} a été supprimé.`, 'Suppression effectuée');
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression.', 'Erreur');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePin = async (userId: string) => {
    if (!tempPin || tempPin.length < 4 || !/^\d+$/.test(tempPin)) {
      toast.error('Le code PIN doit comporter au moins 4 chiffres.', 'Code PIN invalide');
      return;
    }
    if (/^(\d)\1+$/.test(tempPin) || ['1234', '4321', '0000'].includes(tempPin)) {
      toast.warning('Ce code PIN est trop prévisible (ex: 0000, 1111, 1234). Choisissez un code plus sûr.', 'PIN faible');
      return;
    }
    try {
      if (resetUserPin) {
        await resetUserPin(userId, tempPin);
      } else {
        await updateUser(userId, { pinConfigured: true });
      }
      toast.success('Le code PIN a été mis à jour avec succès.', 'PIN réinitialisé');
      setEditingUserId(null);
      setTempPin('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour du code PIN.', 'Erreur');
    }
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

          {/* Action Header: Search, Filters & Add user button */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, email, téléphone ou poste..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#0A0E1A] border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!isAddingUser && (
                <TactileButton
                  variant="primary"
                  onClick={() => setIsAddingUser(true)}
                  className="text-xs h-9 px-3.5 gap-1.5 flex-shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ajouter un Utilisateur</span>
                </TactileButton>
              )}
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setFilterRole('ALL')}
                className={`px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer whitespace-nowrap ${
                  filterRole === 'ALL'
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-bold'
                    : 'bg-[#0A0E1A] text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                Tous ({users.length})
              </button>
              {ROLE_OPTIONS.map((opt) => {
                const count = users.filter((u) => u.role === opt.role).length;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setFilterRole(opt.role)}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer whitespace-nowrap ${
                      filterRole === opt.role
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 font-bold'
                        : 'bg-[#0A0E1A] text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    {opt.title} ({count})
                  </button>
                );
              })}
            </div>
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
            {filteredUsers.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#151B30] border border-gray-800 text-center flex flex-col items-center justify-center gap-2">
                <Users className="w-8 h-8 text-gray-500" />
                <p className="text-sm font-semibold text-gray-300">Aucun collaborateur trouvé</p>
                <p className="text-xs text-gray-500 max-w-xs">
                  {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun utilisateur dans cette catégorie'}
                </p>
              </div>
            ) : (
              filteredUsers.map(u => {
                const meta = ROLE_OPTIONS.find(r => r.role === u.role) || ROLE_OPTIONS[0];
                const Icon = meta.icon;
                const isEditingThisPin = editingUserId === u.id;
                const isCurrentUser = currentUser.id === u.id;
                const isActive = u.active !== false;

                return (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-2xl bg-[#151B30] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isActive ? 'border-gray-800 hover:border-gray-700' : 'border-rose-950/40 opacity-70 bg-[#121626]'
                    }`}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white truncate">{u.name}</span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Vous
                            </span>
                          )}
                          {!isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Désactivé
                            </span>
                          )}
                        </div>
                        {u.jobTitle && (
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3 h-3 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{u.jobTitle}</span>
                          </div>
                        )}
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

                    {/* Right side: Role badge, PIN & Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800 flex-wrap">
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
                              <span>PIN</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Edit full user profile */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(u)}
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                        title="Modifier les coordonnées et le rôle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Active toggle (disabled for self) */}
                      {!isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserActive(u)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isActive
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                          }`}
                          title={isActive ? 'Désactiver le compte' : 'Activer le compte'}
                        >
                          {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Delete user button (disabled for self) */}
                      {users.length > 1 && !isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#151B30] border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {filteredUsers.length} collaborateur(s) affiché(s) sur {users.length}
          </span>
          <TactileButton variant="primary" onClick={onClose} className="px-5">
            Fermer
          </TactileButton>
        </div>
      </div>

      {/* Edit User Modal Dialog */}
      {editingUserObj && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-[#10162A] border border-blue-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 bg-[#151B30] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Modifier le profil collaborateur</h4>
                  <p className="text-[11px] text-gray-400">{editingUserObj.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserObj(null)}
                className="w-7 h-7 rounded-lg bg-[#0A0E1A] border border-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 flex flex-col gap-4">
              {editError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-300 font-medium">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-[#0A0E1A] border border-gray-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-300 font-medium">Intitulé de poste</label>
                  <input
                    type="text"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    placeholder="Ex: Chef de comptoir"
                    className="h-9 px-3 rounded-xl bg-[#0A0E1A] border border-gray-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-300 font-medium">Email professionnel</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-[#0A0E1A] border border-gray-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-300 font-medium">Numéro de téléphone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-[#0A0E1A] border border-gray-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-300 font-medium">Rôle & Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = editRole === opt.role;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => setEditRole(opt.role)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500'
                            : 'bg-[#0A0E1A] border-gray-800 hover:border-gray-700 text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                          <span className="text-xs font-bold text-white">{opt.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A0E1A] border border-gray-800">
                <div>
                  <span className="text-xs font-bold text-white block">Statut du compte</span>
                  <span className="text-[11px] text-gray-400 block">
                    {editActive ? 'Actif - peut se connecter et travailler' : 'Désactivé - accès bloqué'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    editActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {editActive ? 'Compte Actif' : 'Compte Inactif'}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <TactileButton
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUserObj(null)}
                  className="text-xs h-9"
                  disabled={isSubmittingEdit}
                >
                  Annuler
                </TactileButton>
                <TactileButton
                  type="submit"
                  variant="primary"
                  className="text-xs h-9 px-4"
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </TactileButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#10162A] border border-rose-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="text-base font-bold text-white">Supprimer l'utilisateur ?</h4>
              <p className="text-xs text-gray-400 mt-1">
                Êtes-vous sûr de vouloir supprimer définitivement le collaborateur{' '}
                <strong className="text-white">{userToDelete.name}</strong> ({userToDelete.email}) ?
              </p>
              <p className="text-[11px] text-rose-400 mt-1">
                Cette action révoquera son accès et supprimera son profil.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <TactileButton
                type="button"
                variant="outline"
                onClick={() => setUserToDelete(null)}
                className="flex-1 text-xs h-9"
                disabled={isDeleting}
              >
                Annuler
              </TactileButton>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

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
