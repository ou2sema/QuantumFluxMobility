import { db } from '../../lib/firebase';
import { collection, doc, setDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { DamageRecord, DamageStatus } from '../../types';
import { activityService } from '../activity/activity.service';

export const damageService = {
  /**
   * Records a new damage event (from check-out or fleet audit).
   */
  async recordDamage(
    damage: DamageRecord,
    actor: { id: string; name: string }
  ): Promise<void> {
    const docRef = doc(db, 'damageRecords', damage.id);
    await setDoc(docRef, {
      ...damage,
      reportedAt: damage.reportedAt || new Date().toISOString(),
      status: damage.status || 'OPEN',
    });

    await activityService.logAction(
      actor,
      'DAMAGE_REPORTED',
      'DAMAGE',
      damage.id,
      `Dommage signalé sur ${damage.vehiclePlate || damage.vehicleId} (${damage.zone} - ${damage.severity}): ${damage.description} (Coût estimé: ${damage.repairCost} DT)`
    );
  },

  /**
   * Updates damage processing status.
   */
  async updateDamageStatus(
    damageId: string,
    status: DamageStatus,
    repairCost: number,
    actor: { id: string; name: string },
    chargedToClientId?: string
  ): Promise<void> {
    const docRef = doc(db, 'damageRecords', damageId);
    const updates: Partial<DamageRecord> = {
      status,
      repairCost,
    };
    if (status === 'RESOLVED') {
      updates.resolvedAt = new Date().toISOString();
    }
    if (chargedToClientId) {
      updates.chargedToClientId = chargedToClientId;
    }

    await updateDoc(docRef, updates);

    await activityService.logAction(
      actor,
      'DAMAGE_UPDATED',
      'DAMAGE',
      damageId,
      `Dossier dommage mis à jour: statut ${status}, montant réparations ${repairCost} DT`
    );
  },

  /**
   * Fetches damages for a specific vehicle.
   */
  async getVehicleDamages(vehicleId: string): Promise<DamageRecord[]> {
    try {
      const q = query(collection(db, 'damageRecords'), where('vehicleId', '==', vehicleId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DamageRecord, 'id'>),
      }));
    } catch (err) {
      console.warn('Error fetching vehicle damages:', err);
      return [];
    }
  },
};
