import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: "AIzaSyArZnefFhplHOffkc2YvRmPFdDd1PzX_Ps",
  authDomain: "quantumflux-mobility.firebaseapp.com",
  projectId: "quantumflux-mobility",
  storageBucket: "quantumflux-mobility.firebasestorage.app",
  messagingSenderId: "711887714288",
  appId: "1:711887714288:web:b1e3ab344e09da5f9d8f35",
  measurementId: "G-SMEFG2VFPD"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId if provided
let firestoreInstance: Firestore;
try {
  const customDbId = firebaseConfigData.firestoreDatabaseId;
  if (customDbId && customDbId !== '(default)') {
    firestoreInstance = getFirestore(app, customDbId);
  } else {
    firestoreInstance = getFirestore(app);
  }
} catch (err) {
  console.warn('Error initializing Firestore with custom dbId, falling back to default:', err);
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

/**
 * Subscribe in real-time to a Firestore collection
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, collectionName);
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as T),
        id: docSnap.id,
      }));
      onData(items);
    },
    (err) => {
      console.error(`Firestore real-time subscription error on '${collectionName}':`, err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save or update a document in Firestore
 */
export async function setFirestoreDoc<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    // Strip undefined values to avoid Firestore serialization errors
    const cleaned = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error(`Error writing doc to ${collectionName}/${docId}:`, error);
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteFirestoreDoc(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting doc from ${collectionName}/${docId}:`, error);
  }
}

/**
 * Push all dataset collections to Firestore in batches
 */
export async function pushAllCollectionsToFirestore(data: {
  vehicles: any[];
  bookings: any[];
  clients: any[];
  maintenances: any[];
  appUsers: any[];
  checkIns: any[];
  checkOuts: any[];
  agencies: any[];
}): Promise<{ success: boolean; error?: string; count: number }> {
  try {
    let totalCount = 0;
    const batch = writeBatch(db);

    const map = [
      { name: 'vehicles', items: data.vehicles },
      { name: 'bookings', items: data.bookings },
      { name: 'clients', items: data.clients },
      { name: 'maintenances', items: data.maintenances },
      { name: 'appUsers', items: data.appUsers },
      { name: 'checkIns', items: data.checkIns },
      { name: 'checkOuts', items: data.checkOuts },
      { name: 'agencies', items: data.agencies },
    ];

    for (const group of map) {
      for (const item of group.items) {
        if (!item.id) continue;
        const ref = doc(db, group.name, String(item.id));
        const cleaned = JSON.parse(JSON.stringify(item));
        batch.set(ref, cleaned, { merge: true });
        totalCount++;
      }
    }

    await batch.commit();
    return { success: true, count: totalCount };
  } catch (err: any) {
    console.error('Error committing batch to Firestore:', err);
    return { success: false, error: err?.message || String(err), count: 0 };
  }
}

/**
 * Seeds collections only if Firestore has not been initialized yet (e.g. no bookings).
 * This prevents overwriting user modifications, checked-in bookings, or new records on app reload.
 */
export async function seedCollectionsIfEmpty(data: {
  vehicles: any[];
  bookings: any[];
  clients: any[];
  maintenances: any[];
  appUsers: any[];
  checkIns: any[];
  checkOuts: any[];
  agencies: any[];
}): Promise<{ success: boolean; seeded: boolean; error?: string; count: number }> {
  try {
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    if (!bookingsSnap.empty) {
      // Data already present in Firestore: DO NOT OVERWRITE!
      return { success: true, seeded: false, count: bookingsSnap.size };
    }

    // Firestore is empty: perform initial seeding
    const result = await pushAllCollectionsToFirestore(data);
    return { success: result.success, seeded: true, count: result.count, error: result.error };
  } catch (err: any) {
    console.warn('Error checking or seeding Firestore:', err);
    return { success: false, seeded: false, error: err?.message || String(err), count: 0 };
  }
}
