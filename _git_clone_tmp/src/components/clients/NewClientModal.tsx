import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientDocument } from '../../types';
import {
  User,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Sparkles,
  Scan,
  ShieldCheck,
  AlertTriangle,
  X,
  Check,
  Star,
  FileText,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { TactileButton } from '../ui/TactileButton';
import { LicenseScannerModal } from '../ui/LicenseScannerModal';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newClient: Client) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addClient } = useApp();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('1992-05-15');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseIssueDate, setLicenseIssueDate] = useState('2018-04-10');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('2033-04-10');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [vipStatus, setVipStatus] = useState(false);
  const [notes, setNotes] = useState('');

  // Attached License Document / Photo
  const [licensePhotoUrl, setLicensePhotoUrl] = useState<string | null>(null);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form validation errors & submission state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isScannerOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isScannerOpen, onClose]);

  if (!isOpen) return null;

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!lastName.trim()) newErrors.lastName = 'Le nom de famille est requis';
    if (!phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (phone.trim().length < 6) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }
    if (!email.trim()) {
      newErrors.email = "L'adresse email est requise";
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Format email invalide';
    }
    if (!licenseNumber.trim()) {
      newErrors.licenseNumber = 'Le numéro de permis est requis';
    }
    if (!licenseExpiryDate) {
      newErrors.licenseExpiryDate = "La date d'expiration est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // OCR Scan Completed Callback
  const handleOcrComplete = (result: any, photoUrl: string) => {
    setIsScannerOpen(false);

    if (result.fullName) {
      const parts = result.fullName.trim().split(/\s+/);
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
      } else {
        setLastName(parts[0]);
      }
    }

    if (result.number) {
      setLicenseNumber(result.number.toUpperCase());
    }

    if (result.expiryDate) {
      setLicenseExpiryDate(result.expiryDate);
    }

    if (photoUrl) {
      setLicensePhotoUrl(photoUrl);
    }

    // Clear any previous error on these fields
    setErrors((prev) => {
      const next = { ...prev };
      delete next.firstName;
      delete next.lastName;
      delete next.licenseNumber;
      delete next.licenseExpiryDate;
      return next;
    });
  };

  // Check if license is expiring soon
  const isExpiringSoon = (() => {
    if (!licenseExpiryDate) return false;
    const expiry = new Date(licenseExpiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 60;
  })();

  const isExpired = (() => {
    if (!licenseExpiryDate) return false;
    const expiry = new Date(licenseExpiryDate);
    const now = new Date();
    return expiry < now;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const docs: ClientDocument[] = [];
      if (licensePhotoUrl) {
        docs.push({
          id: `doc-lic-${Date.now()}`,
          type: 'PERMIS_RECTO',
          name: 'Permis de Conduire (Scan OCR)',
          url: licensePhotoUrl,
          uploadedAt: new Date().toISOString(),
        });
      }

      const newClient = addClient({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim().toUpperCase(),
        licenseIssueDate: licenseIssueDate || '2018-04-10',
        licenseExpiryDate: licenseExpiryDate || '2033-04-10',
        isLicenseExpiringSoon: isExpiringSoon,
        birthDate: birthDate || '1992-05-15',
        address: address.trim() || 'Adresse non renseignée',
        city: city.trim() || 'Paris',
        vipStatus,
        notes: notes.trim() || undefined,
        documents: docs,
      } as any);

      onSuccess?.(newClient);
      onClose();
    } catch (err) {
      console.error('Erreur création client:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-client-title"
      >
        <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="pt-safe px-5 py-4 bg-[#131E38] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-900/40">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 id="new-client-title" className="text-lg font-extrabold text-white flex items-center gap-2">
                  <span>Nouveau Client</span>
                  {vipStatus && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> VIP
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">Créer une fiche conducteur & permis</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              title="Fermer"
              aria-label="Fermer la fenêtre"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
            {/* Quick OCR Scan Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-purple-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Numérisation Rapide du Permis</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-extrabold border border-indigo-500/30">
                      OCR IA
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Scannez le permis pour pré-remplir automatiquement les coordonnées
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition flex-shrink-0 shadow-md shadow-indigo-900/50 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Scanner Permis</span>
                <span className="sm:hidden">Scanner</span>
              </button>
            </div>

            {/* Scanned Photo Preview if available */}
            {licensePhotoUrl && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={licensePhotoUrl}
                    alt="Scan permis"
                    className="w-12 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white flex items-center gap-1 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Permis scanné & vérifié</span>
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">Document joint au dossier client</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLicensePhotoUrl(null)}
                  className="text-slate-400 hover:text-red-400 p-1 transition cursor-pointer"
                  title="Supprimer la photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* SECTION 1: Identité */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Identité du Conducteur</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Prénom <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                    }}
                    placeholder="Ex: Alexandre"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#131B2E] border ${
                      errors.firstName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700'
                    } text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium`}
                  />
                  {errors.firstName && <p className="text-red-400 text-[11px] mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Nom de famille <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                    }}
                    placeholder="Ex: Dupont"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#131B2E] border ${
                      errors.lastName ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700'
                    } text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium`}
                  />
                  {errors.lastName && <p className="text-red-400 text-[11px] mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#131B2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* SECTION 2: Coordonnées */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Coordonnées</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Téléphone <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="06 12 34 56 78"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#131B2E] border ${
                        errors.phone ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700'
                      } text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-[11px] mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder="alexandre.dupont@email.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#131B2E] border ${
                        errors.email ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700'
                      } text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Adresse postale
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: 14 rue de la Paix"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#131B2E] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Ville & Code Postal
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Paris 75001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131B2E] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Permis de Conduire */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Permis de Conduire</span>
              </span>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">
                  Numéro de Permis <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => {
                    setLicenseNumber(e.target.value.toUpperCase());
                    if (errors.licenseNumber) setErrors((prev) => ({ ...prev, licenseNumber: '' }));
                  }}
                  placeholder="Ex: 24AB910248"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#131B2E] border font-mono ${
                    errors.licenseNumber ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-700'
                  } text-cyan-300 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-bold uppercase`}
                />
                {errors.licenseNumber && <p className="text-red-400 text-[11px] mt-1">{errors.licenseNumber}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Date de délivrance
                  </label>
                  <input
                    type="date"
                    value={licenseIssueDate}
                    onChange={(e) => setLicenseIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#131B2E] border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Date d'expiration <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={licenseExpiryDate}
                    onChange={(e) => {
                      setLicenseExpiryDate(e.target.value);
                      if (errors.licenseExpiryDate) setErrors((prev) => ({ ...prev, licenseExpiryDate: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#131B2E] border ${
                      errors.licenseExpiryDate
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : isExpired
                        ? 'border-red-500 text-red-400'
                        : isExpiringSoon
                        ? 'border-amber-500 text-amber-300'
                        : 'border-slate-700 text-white'
                    } text-sm focus:outline-none focus:border-indigo-500 font-medium`}
                  />
                  {errors.licenseExpiryDate && (
                    <p className="text-red-400 text-[11px] mt-1">{errors.licenseExpiryDate}</p>
                  )}
                  {isExpired && (
                    <p className="text-red-400 text-[11px] mt-1 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      Permis expiré ! Le conducteur ne pourra pas louer.
                    </p>
                  )}
                  {isExpiringSoon && !isExpired && (
                    <p className="text-amber-400 text-[11px] mt-1 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      Attention : permis expire dans moins de 60 jours.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 4: Options & Notes */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#131B2E] border border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      vipStatus ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${vipStatus ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Statut VIP Conducteur</h4>
                    <p className="text-[10px] text-slate-400">Accès prioritaire & conditions préférentielles</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVipStatus(!vipStatus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    vipStatus ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={vipStatus}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      vipStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">
                  Notes internes & observations
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes sur les préférences du client, historique de conduite..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#131B2E] border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-medium"
                />
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="pb-safe px-5 py-4 bg-[#131E38] border-t border-slate-800 flex items-center gap-3">
            <TactileButton variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </TactileButton>

            <TactileButton
              variant="primary"
              className="flex-1 font-black"
              icon={Check}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création en cours...' : 'Enregistrer le Client'}
            </TactileButton>
          </div>
        </div>
      </div>

      {/* License OCR Scanner Modal */}
      {isScannerOpen && (
        <LicenseScannerModal
          onScanComplete={handleOcrComplete}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </>
  );
};
