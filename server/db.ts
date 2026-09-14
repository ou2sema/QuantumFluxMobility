import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  setLogLevel,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load config from firebase-applet-config.json
let firebaseConfig: any;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  firebaseConfig = JSON.parse(raw);
} catch (e) {
  console.warn('Could not load firebase-applet-config.json, using environment variables');
  firebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'logical-tempo-qmvz5',
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || '(default)',
  };
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const rawDbId = firebaseConfig.firestoreDatabaseId;
const dbId = (!rawDbId || rawDbId === 'default' || rawDbId === '(default)') ? '(default)' : rawDbId;
export const serverDb: Firestore = dbId === '(default)' ? getFirestore(app) : getFirestore(app, dbId);
setLogLevel('error');

// In-memory mirror cache for unit-tests and offline fallback
export const memoryUsers = new Map<string, ServerUserRecord>();
export const memoryCredentials = new Map<string, ServerUserCredential>();

export interface ServerUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  agencyId: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  active: boolean;
  pinConfigured: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ServerUserCredential {
  userId: string;
  pinHash: string;
  salt?: string;
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms
  lastAttemptAt?: number;
  updatedAt: string;
}

// Helper to prevent hanging operations when Firestore database is offline or not found
let isFirestoreOffline = false;
const TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firestore timeout')), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      isFirestoreOffline = false;
      return res;
    }),
    timeoutPromise,
  ]);
}

async function runWithFirestore<T>(op: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (isFirestoreOffline) {
    return fallback();
  }
  try {
    const res = await withTimeout(op(), TIMEOUT_MS);
    return res;
  } catch (err: any) {
    isFirestoreOffline = true;
    return fallback();
  }
}

// Helper: Get user profile by ID or email
export async function getUserProfile(userId: string): Promise<ServerUserRecord | null> {
  return runWithFirestore(
    async () => {
      // 1. Direct ID lookup
      const snap = await getDoc(doc(serverDb, 'appUsers', userId));
      if (snap.exists()) {
        const data = snap.data();
        const { pinCode, pinHash, ...safeData } = data as any;
        const profile: ServerUserRecord = {
          ...(safeData as ServerUserRecord),
          id: snap.id,
          pinConfigured: Boolean(safeData.pinConfigured || pinCode || pinHash),
          ...(pinCode ? { rawPinCode: String(pinCode) } : {}),
        } as any;
        memoryUsers.set(userId, profile);
        return profile;
      }

      // 2. Lookup in all docs if email or alias
      const allSnap = await getDocs(collection(serverDb, 'appUsers'));
      if (!allSnap.empty) {
        const term = userId.trim().toLowerCase();
        for (const d of allSnap.docs) {
          const dData = d.data() as any;
          if (
            d.id.toLowerCase() === term ||
            (dData.email && dData.email.toLowerCase() === term) ||
            (dData.name && dData.name.toLowerCase().includes(term))
          ) {
            const { pinCode, pinHash, ...safeData } = dData;
            const profile: ServerUserRecord = {
              ...(safeData as ServerUserRecord),
              id: d.id,
              pinConfigured: Boolean(safeData.pinConfigured || pinCode || pinHash),
              ...(pinCode ? { rawPinCode: String(pinCode) } : {}),
            } as any;
            memoryUsers.set(userId, profile);
            memoryUsers.set(d.id, profile);
            return profile;
          }
        }
      }

      return memoryUsers.get(userId) || null;
    },
    () => memoryUsers.get(userId) || null
  );
}

// Helper: List all user profiles
export async function listUserProfiles(): Promise<ServerUserRecord[]> {
  return runWithFirestore(
    async () => {
      const snap = await getDocs(collection(serverDb, 'appUsers'));
      if (!snap.empty) {
        return snap.docs.map((d) => {
          const { pinCode, pinHash, ...safe } = d.data() as any;
          return {
            ...(safe as ServerUserRecord),
            id: d.id,
            pinConfigured: Boolean(safe.pinConfigured || pinCode || pinHash),
          };
        });
      }
      return Array.from(memoryUsers.values());
    },
    () => Array.from(memoryUsers.values())
  );
}

// Helper: Save user profile
export async function saveUserProfile(user: ServerUserRecord): Promise<void> {
  // Ensure no pinCode or pinHash is ever saved in appUsers
  const { id, ...data } = user as any;
  if (!id) return;
  delete data.pinCode;
  delete data.pinHash;
  memoryUsers.set(id, { id, ...data });
  await runWithFirestore(
    async () => {
      await setDoc(doc(serverDb, 'appUsers', id), data, { merge: true });
    },
    () => {}
  );
}

// Helper: Delete or deactivate user profile
export async function deactivateUserProfile(userId: string): Promise<void> {
  const user = memoryUsers.get(userId);
  if (user) user.active = false;
  await runWithFirestore(
    async () => {
      await updateDoc(doc(serverDb, 'appUsers', userId), {
        active: false,
        updatedAt: new Date().toISOString(),
      });
    },
    () => {}
  );
}

// Helper: Get user credential (ONLY for authentication backend)
export async function getUserCredential(userId: string): Promise<ServerUserCredential | null> {
  return runWithFirestore(
    async () => {
      const snap = await getDoc(doc(serverDb, 'userCredentials', userId));
      if (snap.exists()) {
        const cred = snap.data() as ServerUserCredential;
        memoryCredentials.set(userId, cred);
        return cred;
      }
      return memoryCredentials.get(userId) || null;
    },
    () => memoryCredentials.get(userId) || null
  );
}

// Helper: Save user credential
export async function saveUserCredential(cred: ServerUserCredential): Promise<void> {
  if (!cred || !cred.userId) return;
  memoryCredentials.set(cred.userId, { ...cred });
  await runWithFirestore(
    async () => {
      await setDoc(doc(serverDb, 'userCredentials', cred.userId), cred, { merge: true });
    },
    () => {}
  );
}

// Helper: Delete user credential
export async function deleteUserCredential(userId: string): Promise<void> {
  memoryCredentials.delete(userId);
  await runWithFirestore(
    async () => {
      await deleteDoc(doc(serverDb, 'userCredentials', userId));
    },
    () => {}
  );
}

// Helper: Audit log write
export async function logSecurityEvent(actor: string, action: string, details: string): Promise<void> {
  const logId = `sec-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await runWithFirestore(
    async () => {
      await setDoc(doc(serverDb, 'activityLogs', logId), {
        id: logId,
        timestamp: new Date().toISOString(),
        actor,
        actorRole: 'SECURITY_SYSTEM',
        action,
        details,
        targetType: 'AUTH',
        targetId: actor,
      });
    },
    () => {}
  );
}
