import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { MOCK_USERS } from '../data/mockData';
import {
  auth,
  signInWithGooglePopup,
  signOutFirebase,
  subscribeToCollection,
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  sessionToken: string | null;
  addUser: (userData: Omit<User, 'id'> & { pinCode?: string; pin?: string }) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetUserPin: (userId: string, newPin: string) => Promise<void>;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  lockApp: () => void;
  unlockWithPin: (pin: string, targetUserId?: string) => Promise<{ success: boolean; error?: string; isLocked?: boolean; lockedUntil?: number }>;
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_STORAGE_PREFIX = 'autofleet_pro_';
const SESSION_STORAGE_TOKEN_KEY = 'autofleet_pro_session_token';

// Helper to sanitize user object: remove any plaintext pinCode or pinHash
function sanitizeUser(u: any): User {
  if (!u) return u;
  const { pinCode, pinHash, ...safe } = u;
  return {
    ...safe,
    pinConfigured: Boolean(safe.pinConfigured || pinCode || pinHash),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const list = parsed.map(sanitizeUser);
          const hasOussema = list.some((u) => u.id === 'u-admin-oussema' || u.email === 'ou2sema@gmail.com');
          if (!hasOussema && MOCK_USERS[0]) {
            list.unshift(MOCK_USERS[0]);
          }
          return list;
        }
      } catch (e) {
        return MOCK_USERS;
      }
    }
    return MOCK_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeUser(parsed);
      } catch (e) {
        return MOCK_USERS[0];
      }
    }
    return MOCK_USERS[0];
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Security Sanitization: Purge any legacy plaintext pinCode from localStorage on startup
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.pinCode || parsed.pinHash) {
          delete parsed.pinCode;
          delete parsed.pinHash;
          localStorage.setItem(LOCAL_STORAGE_PREFIX + 'user', JSON.stringify(parsed));
        }
      }
      const rawUsers = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'users');
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.map(sanitizeUser);
          localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(cleaned));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Validate active session token with backend if present on reload
  useEffect(() => {
    const token = sessionToken || sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
    if (!token) return;

    fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.valid && data.user) {
          setCurrentUser(sanitizeUser(data.user));
          setIsLocked(false);
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_TOKEN_KEY);
          setSessionToken(null);
          setIsLocked(true);
        }
      })
      .catch(() => {
        // Dev offline fallback or network failure
      });
  }, []);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        const matched = users.find((u) => u.email.toLowerCase() === user.email?.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
        } else {
          const role: UserRole = 'AGENT_COMPTOIR';
          const newStaff: User = {
            id: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role,
            agencyId: 'agency-paris-orly',
            avatarUrl: user.photoURL || undefined,
            pinConfigured: false,
            active: true,
          };
          setUsers((prev) => {
            const exists = prev.find((u) => u.email === newStaff.email);
            return exists ? prev : [...prev, newStaff];
          });
          setCurrentUser(newStaff);
        }
      }
    });
    return () => unsubscribe();
  }, [users]);

  // Sync users from Firestore appUsers collection (safe profiles only)
  useEffect(() => {
    const unsubscribe = subscribeToCollection<User>('appUsers', (items) => {
      if (items && items.length > 0) {
        const cleaned = items.map(sanitizeUser);
        setUsers(cleaned);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(cleaned));
      }
    });
    return () => unsubscribe();
  }, []);

  // Save sanitized current user to localStorage
  useEffect(() => {
    const sanitized = sanitizeUser(currentUser);
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'user', JSON.stringify(sanitized));
  }, [currentUser]);

  // Save sanitized users list to localStorage
  useEffect(() => {
    const sanitizedList = users.map(sanitizeUser);
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(sanitizedList));
  }, [users]);

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  // Secure Server-Side PIN Verification
  const unlockWithPin = useCallback(
    async (
      pin: string,
      targetUserId?: string
    ): Promise<{ success: boolean; error?: string; isLocked?: boolean; lockedUntil?: number }> => {
      const userToVerify = targetUserId
        ? users.find((u) => u.id === targetUserId)
        : currentUser;

      if (!userToVerify) {
        return { success: false, error: 'Identifiants invalides.' };
      }

      try {
        const response = await fetch('/api/auth/pin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userToVerify.id,
            pin,
          }),
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.ok && data && data.success) {
          if (data.sessionToken) {
            setSessionToken(data.sessionToken);
            try {
              sessionStorage.setItem(SESSION_STORAGE_TOKEN_KEY, data.sessionToken);
            } catch {}
          }
          if (data.user) {
            const safeUser = sanitizeUser(data.user);
            setCurrentUser(safeUser);
          } else if (targetUserId && targetUserId !== currentUser.id) {
            setCurrentUser(userToVerify);
          }
          setIsLocked(false);
          return { success: true };
        } else {
          return {
            success: false,
            error: data?.error || (response.status === 401 ? 'Code PIN incorrect. Veuillez réessayer.' : 'Identifiants invalides.'),
            isLocked: data?.isLocked,
            lockedUntil: data?.lockedUntil,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: 'Serveur temporairement indisponible. Veuillez patienter un instant.',
        };
      }
    },
    [users, currentUser]
  );

  // Admin: Add user with server-side PIN hashing
  const addUser = useCallback(
    async (userData: Omit<User, 'id'> & { pinCode?: string; pin?: string }): Promise<User> => {
      const token = sessionToken || sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
      const rawPin = userData.pinCode || userData.pin || '';

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          agencyId: userData.agencyId,
          jobTitle: userData.jobTitle,
          avatarUrl: userData.avatarUrl,
          active: userData.active !== false,
          pin: rawPin,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la création de l\'utilisateur.');
      }

      const createdUser = sanitizeUser(data.user);
      setUsers((prev) => [...prev.filter((u) => u.id !== createdUser.id), createdUser]);
      return createdUser;
    },
    [sessionToken]
  );

  // Admin: Reset user PIN with server-side hashing
  const resetUserPin = useCallback(
    async (userId: string, newPin: string): Promise<void> => {
      const token = sessionToken || sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
      const response = await fetch(`/api/admin/users/${userId}/reset-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ newPin }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation du code PIN.');
      }

      // Mark user as pinConfigured in state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, pinConfigured: true } : u))
      );
      if (currentUser.id === userId) {
        setCurrentUser((prev) => ({ ...prev, pinConfigured: true }));
      }
    },
    [sessionToken, currentUser.id]
  );

  // Admin: Update user details
  const updateUser = useCallback(
    async (id: string, userData: Partial<User>) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? sanitizeUser({ ...u, ...userData }) : u))
      );
      if (currentUser.id === id) {
        setCurrentUser((prev) => sanitizeUser({ ...prev, ...userData }));
      }

      const token = sessionToken || sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
      try {
        await fetch(`/api/admin/users/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(userData),
        });
      } catch (err) {
        console.warn('Could not sync user update to server:', err);
      }
    },
    [currentUser.id, sessionToken]
  );

  // Admin: Delete/Deactivate user
  const deleteUser = useCallback(
    async (id: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      const token = sessionToken || sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY);
      try {
        await fetch(`/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch (err) {
        console.warn('Could not sync user deletion to server:', err);
      }
    },
    [sessionToken]
  );

  const signInWithGoogle = useCallback(async () => {
    const user = await signInWithGooglePopup();
    if (user) {
      setIsLocked(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutFirebase();
    try {
      sessionStorage.removeItem(SESSION_STORAGE_TOKEN_KEY);
    } catch {}
    setSessionToken(null);
    setIsLocked(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        sessionToken,
        addUser,
        updateUser,
        deleteUser,
        resetUserPin,
        isLocked,
        setIsLocked,
        lockApp,
        unlockWithPin,
        firebaseUser,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
