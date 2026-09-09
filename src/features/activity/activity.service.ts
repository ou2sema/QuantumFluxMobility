import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { ActivityLog } from '../../types';

export const activityService = {
  /**
   * Records an immutable operational audit log entry.
   */
  async logAction(
    actor: { id: string; name: string },
    action: string,
    entityType: ActivityLog['entityType'],
    entityId: string,
    details: string
  ): Promise<void> {
    try {
      const logEntry: Omit<ActivityLog, 'id'> = {
        actorId: actor.id || 'SYSTEM',
        actorName: actor.name || 'Système',
        action,
        entityType,
        entityId,
        details,
        timestamp: new Date().toISOString(),
      };

      await addDoc(collection(db, 'activityLogs'), logEntry);
    } catch (err) {
      console.warn('Could not record activity log to Firestore:', err);
    }
  },

  /**
   * Fetches the latest activity logs for managers and admins.
   */
  async getRecentLogs(maxCount: number = 50): Promise<ActivityLog[]> {
    try {
      const q = query(
        collection(db, 'activityLogs'),
        orderBy('timestamp', 'desc'),
        limit(maxCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ActivityLog, 'id'>),
      }));
    } catch (err) {
      console.warn('Error fetching activity logs:', err);
      return [];
    }
  },
};
