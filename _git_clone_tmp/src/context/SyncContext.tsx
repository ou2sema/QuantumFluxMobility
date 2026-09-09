import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pushAllCollectionsToFirestore, testConnection } from '../lib/firebase';
import { useToast } from './ToastContext';
import { useFleet } from './FleetContext';
import { useBookings } from './BookingContext';
import { useClients } from './ClientContext';
import { useMaintenance } from './MaintenanceContext';
import { useAuth } from './AuthContext';
import { useAgencies } from './AgencyContext';

interface SyncContextType {
  isFirestoreConnected: boolean;
  firestoreError: string | null;
  isSyncingFirestore: boolean;
  lastFirestoreSync: string | null;
  syncAllToFirestore: () => Promise<{ success: boolean; error?: string; count: number }>;
  isOffline: boolean;
  setIsOffline: (val: boolean | ((prev: boolean) => boolean)) => void;
  pendingSyncCount: number;
  triggerSync: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { vehicles } = useFleet();
  const { bookings, checkIns, checkOuts } = useBookings();
  const { clients } = useClients();
  const { maintenances } = useMaintenance();
  const { users } = useAuth();
  const { agencies } = useAgencies();

  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);
  const [lastFirestoreSync, setLastFirestoreSync] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsFirestoreConnected(true);
      toast.success('Connexion réseau rétablie. Données en cours de synchronisation.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      setIsFirestoreConnected(false);
      toast.warning('Connexion perdue : basculement en mode hors-ligne.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection test
    testConnection().then((connected) => {
      setIsFirestoreConnected(connected);
      if (!connected) {
        setFirestoreError('Serveur Firestore non joignable en direct');
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const syncAllToFirestore = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
    count: number;
  }> => {
    setIsSyncingFirestore(true);
    setFirestoreError(null);
    try {
      const result = await pushAllCollectionsToFirestore({
        vehicles,
        bookings,
        clients,
        maintenances,
        appUsers: users,
        checkIns,
        checkOuts,
        agencies,
      });

      setIsSyncingFirestore(false);
      if (result.success) {
        setLastFirestoreSync(new Date().toLocaleTimeString('fr-FR'));
        setIsFirestoreConnected(true);
        setPendingSyncCount(0);
        toast.success(`Synchronisation Cloud réussie (${result.count} documents)`);
        return result;
      } else {
        setFirestoreError(result.error || 'Erreur de synchronisation');
        toast.error(`Échec synchronisation: ${result.error}`);
        return result;
      }
    } catch (err: any) {
      setIsSyncingFirestore(false);
      const msg = err?.message || String(err);
      setFirestoreError(msg);
      toast.error(`Erreur: ${msg}`);
      return { success: false, error: msg, count: 0 };
    }
  }, [vehicles, bookings, clients, maintenances, users, checkIns, checkOuts, agencies, toast]);

  const triggerSync = useCallback(() => {
    syncAllToFirestore();
  }, [syncAllToFirestore]);

  return (
    <SyncContext.Provider
      value={{
        isFirestoreConnected,
        firestoreError,
        isSyncingFirestore,
        lastFirestoreSync,
        syncAllToFirestore,
        isOffline,
        setIsOffline,
        pendingSyncCount,
        triggerSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
