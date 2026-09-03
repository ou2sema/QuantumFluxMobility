import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface FirestoreSyncModalProps {
  onClose: () => void;
}

export const FirestoreSyncModal: React.FC<FirestoreSyncModalProps> = ({ onClose }) => {
  const {
    vehicles,
    bookings,
    clients,
    maintenances,
    users,
    syncAllToFirestore,
    isSyncingFirestore,
    firestoreError,
    lastFirestoreSync,
  } = useApp();

  const [copiedRule, setCopiedRule] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2500);
  };

  const handleForceSync = async () => {
    setSyncFeedback(null);
    const result = await syncAllToFirestore();
    if (result.success) {
      setSyncFeedback({
        success: true,
        message: `${result.count} documents injectés avec succès dans votre base (default) !`,
      });
    } else {
      setSyncFeedback({
        success: false,
        message: result.error || 'Erreur de transmission vers Firestore.',
      });
    }
  };

  const totalDocs =
    vehicles.length +
    bookings.length +
    clients.length +
    maintenances.length +
    users.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0F1424] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#151B30]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Connexion Cloud Firestore
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  (default)
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Projet Firebase : <span className="text-amber-300 font-mono">quantumflux-mobility</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status card */}
          <div className="p-4 rounded-xl bg-[#151B30] border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">État de synchronisation</span>
              {lastFirestoreSync ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Dernier envoi à {lastFirestoreSync}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Initialisation en cours...
                </span>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-gray-800/80">
              <div className="p-2 rounded-lg bg-gray-900/60">
                <div className="text-lg font-bold text-white">{vehicles.length}</div>
                <div className="text-[10px] text-gray-400">Véhicules</div>
              </div>
              <div className="p-2 rounded-lg bg-gray-900/60">
                <div className="text-lg font-bold text-white">{bookings.length}</div>
                <div className="text-[10px] text-gray-400">Locations</div>
              </div>
              <div className="p-2 rounded-lg bg-gray-900/60">
                <div className="text-lg font-bold text-white">{clients.length}</div>
                <div className="text-[10px] text-gray-400">Clients</div>
              </div>
              <div className="p-2 rounded-lg bg-gray-900/60">
                <div className="text-lg font-bold text-white">{maintenances.length}</div>
                <div className="text-[10px] text-gray-400">Atelier</div>
              </div>
            </div>
          </div>

          {/* Sync Trigger Button */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={isSyncingFirestore}
              onClick={handleForceSync}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingFirestore ? 'animate-spin' : ''}`} />
              <span>
                {isSyncingFirestore
                  ? 'Écriture des collections dans Firestore...'
                  : `Transférer les données (${totalDocs} documents) vers Firestore`}
              </span>
            </button>
            <p className="text-[11px] text-center text-gray-400">
              Crée et remplit immédiatement les collections <code className="text-amber-300">vehicles</code>,{' '}
              <code className="text-amber-300">bookings</code>, <code className="text-amber-300">clients</code> dans votre console Firebase.
            </p>
          </div>

          {/* Sync Result Feedback */}
          {syncFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                syncFeedback.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {syncFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
              )}
              <div className="flex-1">
                <span className="font-semibold">{syncFeedback.message}</span>
                {syncFeedback.success && (
                  <p className="mt-1 text-gray-300 text-[11px]">
                    Rechargez la page de votre console Firebase ou cliquez sur la collection pour afficher vos documents.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Firestore Rules Warning / Helper */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs space-y-3">
            <div className="flex items-center gap-2 text-blue-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Règles de sécurité Firestore dans votre console</span>
            </div>
            <p className="text-gray-300 leading-relaxed text-[12px]">
              Si la console Firebase affiche toujours <em className="text-white">"Commencer une collection"</em> même après le transfert, c'est que les règles par défaut de votre projet bloquent l'écriture (<code className="text-rose-400">if false;</code>).
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>Dans Firebase Console &gt; Onglet <strong>Règles</strong> :</span>
                <button
                  type="button"
                  onClick={handleCopyRules}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                >
                  {copiedRule ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRule ? 'Copié !' : 'Copier la règle'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-black/60 border border-gray-800 text-[11px] font-mono text-amber-200 overflow-x-auto">
{sampleRules}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#151B30] flex items-center justify-between">
          <div className="text-[11px] text-gray-400">
            Base : <strong className="text-gray-200">(default)</strong> | Mode : <span className="text-emerald-400">Temps Réel</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
