import { db } from '../../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Vehicle, VehicleStatus } from '../../types';
import { activityService } from '../activity/activity.service';

export const vehiclesService = {
  /**
   * Transitions vehicle to a new status with validation.
   */
  async updateVehicleStatus(
    vehicleId: string,
    newStatus: VehicleStatus,
    actor: { id: string; name: string },
    additionalFields: Partial<Vehicle> = {}
  ): Promise<void> {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const updates = {
      status: newStatus,
      ...additionalFields,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(vehicleRef, updates);

    await activityService.logAction(
      actor,
      'STATUS_CHANGED',
      'VEHICLE',
      vehicleId,
      `Statut du véhicule mis à jour vers: ${newStatus}`
    );
  },

  /**
   * Creates or registers a new vehicle in the fleet.
   */
  async registerVehicle(
    vehicle: Vehicle,
    actor: { id: string; name: string }
  ): Promise<void> {
    const vehicleRef = doc(db, 'vehicles', vehicle.id);
    await setDoc(vehicleRef, vehicle);

    await activityService.logAction(
      actor,
      'CREATED',
      'VEHICLE',
      vehicle.id,
      `Nouveau véhicule immatriculé: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
    );
  },

  /**
   * Updates vehicle mileage and fuel level after an inspection.
   */
  async recordVehicleReturnSpecs(
    vehicleId: string,
    mileage: number,
    fuelLevel: number,
    actor: { id: string; name: string }
  ): Promise<void> {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      mileage,
      currentFuelLevel: fuelLevel,
      status: 'INSPECTION',
      updatedAt: new Date().toISOString(),
    });

    await activityService.logAction(
      actor,
      'INSPECTED',
      'VEHICLE',
      vehicleId,
      `Retour enregistré: Kilométrage ${mileage} km, Carburant ${fuelLevel}%`
    );
  },

  /**
   * Deletes a vehicle from the fleet.
   */
  async deleteVehicle(
    vehicleId: string,
    actor: { id: string; name: string }
  ): Promise<void> {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
    await activityService.logAction(
      actor,
      'DELETED',
      'VEHICLE',
      vehicleId,
      `Véhicule retiré du parc actif`
    );
  },
};
