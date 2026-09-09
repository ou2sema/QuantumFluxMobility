import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MaintenanceRecord } from '../types';
import { MOCK_MAINTENANCES } from '../data/mockData';
import { setFirestoreDoc, deleteFirestoreDoc, subscribeToCollection } from '../lib/firebase';
import { useToast } from './ToastContext';
import { useFleet } from './FleetContext';

interface MaintenanceContextType {
  maintenances: MaintenanceRecord[];
  addMaintenanceRecord: (recordData: Omit<MaintenanceRecord, 'id'>) => MaintenanceRecord;
  updateMaintenanceRecord: (id: string, recordData: Partial<MaintenanceRecord>) => void;
  deleteMaintenanceRecord: (id: string) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);
const LOCAL_STORAGE_PREFIX = 'autofleet_pro_';

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { updateVehicleStatus } = useFleet();

  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'maintenances');
    return saved ? JSON.parse(saved) : MOCK_MAINTENANCES;
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection<MaintenanceRecord>('maintenances', (items) => {
      if (items && items.length > 0) {
        setMaintenances(items);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'maintenances', JSON.stringify(items));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'maintenances', JSON.stringify(maintenances));
  }, [maintenances]);

  const addMaintenanceRecord = useCallback(
    (recordData: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord => {
      const newRecord: MaintenanceRecord = {
        ...recordData,
        id: `maint-${Date.now()}`,
      };

      setMaintenances((prev) => [newRecord, ...prev]);
      setFirestoreDoc('maintenances', newRecord.id, newRecord).catch(() => {});

      if (newRecord.status === 'IN_PROGRESS') {
        updateVehicleStatus(newRecord.vehicleId, 'MAINTENANCE');
      }

      toast.success(`Intervention atelier enregistrée (${newRecord.title})`);
      return newRecord;
    },
    [toast, updateVehicleStatus]
  );

  const updateMaintenanceRecord = useCallback(
    (id: string, recordData: Partial<MaintenanceRecord>) => {
      setMaintenances((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...recordData } : m))
      );
      setFirestoreDoc('maintenances', id, recordData).catch(() => {});

      if (recordData.status === 'COMPLETED') {
        const item = maintenances.find((m) => m.id === id);
        if (item) {
          updateVehicleStatus(item.vehicleId, 'AVAILABLE');
        }
      }

      toast.info('Intervention atelier mise à jour');
    },
    [toast, maintenances, updateVehicleStatus]
  );

  const deleteMaintenanceRecord = useCallback(
    (id: string) => {
      setMaintenances((prev) => prev.filter((m) => m.id !== id));
      deleteFirestoreDoc('maintenances', id).catch(() => {});
      toast.info('Intervention supprimée');
    },
    [toast]
  );

  return (
    <MaintenanceContext.Provider
      value={{
        maintenances,
        addMaintenanceRecord,
        updateMaintenanceRecord,
        deleteMaintenanceRecord,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = (): MaintenanceContextType => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};
