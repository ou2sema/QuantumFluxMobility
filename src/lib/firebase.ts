import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

// Resolve configuration: prefer VITE_ env variables if provided, fallback to firebase-applet-config.json
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || "AIzaSyArZnefFhplHOffkc2YvRmPFdDd1PzX_Ps",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || "quantumflux-mobility.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || "quantumflux-mobility",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || "quantumflux-mobility.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || "711887714288",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || "1:711887714288:web:b1e3ab344e09da5f9d8f35",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigData.measurementId || "G-SMEFG2VFPD",
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with database ID normalized to '(default)'
const rawDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId;
export const firestoreDatabaseId: string = (!rawDbId || rawDbId === 'default') ? '(default)' : rawDbId;
export const db: Firestore = getFirestore(app, firestoreDatabaseId);

// Initialize Firebase Auth & Providers
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  }
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

// ----------------------------------------------------
// Error handling standard per Firebase skill
// ----------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Security / Operation Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore on boot as mandated in skill
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or network unreachable.");
    }
    return false;
  }
}
// Call validation
testConnection().catch(() => {});

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
      try {
        handleFirestoreError(err, OperationType.LIST, collectionName);
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
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
    const cleaned = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
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
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
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
 * Seeds collections only if Firestore has not been initialized yet.
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
      return { success: true, seeded: false, count: bookingsSnap.size };
    }

    const result = await pushAllCollectionsToFirestore(data);
    return { success: result.success, seeded: true, count: result.count, error: result.error };
  } catch (err: any) {
    console.warn('Error checking or seeding Firestore:', err);
    return { success: false, seeded: false, error: err?.message || String(err), count: 0 };
  }
}
