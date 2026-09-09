import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Vehicle, VehicleStatus, DamageItem } from '../types';
import { MOCK_VEHICLES } from '../data/mockData';
import { setFirestoreDoc, deleteFirestoreDoc, subscribeToCollection } from '../lib/firebase';
import { useToast } from './ToastContext';

interface FleetContextType {
  vehicles: Vehicle[];
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'damages'>) => Vehicle;
  updateVehicle: (vehicleId: string, vehicleData: Partial<Vehicle>) => void;
  deleteVehicle: (vehicleId: string) => void;
  updateVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  addVehicleDamage: (vehicleId: string, damage: Omit<DamageItem, 'id' | 'addedAt'>) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);
const LOCAL_STORAGE_PREFIX = 'autofleet_pro_';

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'vehicles');
    return saved ? JSON.parse(saved) : MOCK_VEHICLES;
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Vehicle>('vehicles', (items) => {
      if (items && items.length > 0) {
        setVehicles(items);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'vehicles', JSON.stringify(items));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  const addVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'damages'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `v-${Date.now()}`,
      damages: [],
    };
    setVehicles((prev) => [newVehicle, ...prev]);
    setFirestoreDoc('vehicles', newVehicle.id, newVehicle).catch((err) => {
      toast.error('Erreur lors de la sauvegarde du véhicule sur le Cloud');
    });
    toast.success(`Véhicule ${newVehicle.brand} ${newVehicle.model} ajouté avec succès`);
    return newVehicle;
  }, [toast]);

  const updateVehicle = useCallback((vehicleId: string, vehicleData: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, ...vehicleData } : v))
    );
    setFirestoreDoc('vehicles', vehicleId, vehicleData).catch((err) => {
      toast.error('Erreur lors de la mise à jour du véhicule');
    });
  }, [toast]);

  const deleteVehicle = useCallback((vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    deleteFirestoreDoc('vehicles', vehicleId).catch((err) => {
      toast.error('Erreur lors de la suppression du véhicule');
    });
    toast.info('Véhicule retiré de la flotte');
  }, [toast]);

  const updateVehicleStatus = useCallback((vehicleId: string, status: VehicleStatus) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status } : v))
    );
    setFirestoreDoc('vehicles', vehicleId, { status }).catch(() => {});
  }, []);

  const addVehicleDamage = useCallback((vehicleId: string, damage: Omit<DamageItem, 'id' | 'addedAt'>) => {
    const newDamage: DamageItem = {
      ...damage,
      id: `dmg-${Date.now()}`,
      addedAt: new Date().toISOString(),
    };

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const updatedDamages = [...v.damages, newDamage];
          setFirestoreDoc('vehicles', vehicleId, { damages: updatedDamages }).catch(() => {});
          return { ...v, damages: updatedDamages };
        }
        return v;
      })
    );
    toast.warning(`Nouveau dommage enregistré sur le véhicule (${damage.severity})`);
  }, [toast]);

  return (
    <FleetContext.Provider
      value={{
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        updateVehicleStatus,
        addVehicleDamage,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = (): FleetContextType => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
