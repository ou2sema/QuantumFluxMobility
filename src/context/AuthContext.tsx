import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { MOCK_USERS } from '../data/mockData';
import {
  auth,
  signInWithGooglePopup,
  signOutFirebase,
  setFirestoreDoc,
  deleteFirestoreDoc,
  subscribeToCollection,
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (userData: Omit<User, 'id'>) => User;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  lockApp: () => void;
  unlockWithPin: (pin: string, targetUserId?: string) => boolean;
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_STORAGE_PREFIX = 'autofleet_pro_';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'users');
    if (saved) {
      try {
        return JSON.parse(saved);
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
        return JSON.parse(saved);
      } catch (e) {
        return MOCK_USERS[0];
      }
    }
    return MOCK_USERS[0];
  });

  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        // If logged in via Google, check if user matches known staff
        const matched = users.find((u) => u.email.toLowerCase() === user.email?.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
        } else {
          // Add as admin/comptoir
          const role: UserRole = user.email === 'ou2sema@gmail.com' ? 'ADMIN' : 'AGENT_COMPTOIR';
          const newStaff: User = {
            id: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            role,
            pinCode: '1234',
            agencyId: 'agency-paris-orly',
            avatarUrl: user.photoURL || undefined,
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

  // Sync users from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCollection<User>('appUsers', (items) => {
      if (items && items.length > 0) {
        setUsers(items);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(items));
      }
    });
    return () => unsubscribe();
  }, []);

  // Save current user to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Save users list to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockWithPin = useCallback(
    (pin: string, targetUserId?: string): boolean => {
      const userToVerify = targetUserId
        ? users.find((u) => u.id === targetUserId)
        : currentUser;

      if (!userToVerify) return false;

      // Check PIN match (or master override 0000 for emergency)
      if (userToVerify.pinCode === pin || pin === '0000') {
        if (targetUserId && targetUserId !== currentUser.id) {
          setCurrentUser(userToVerify);
        }
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [users, currentUser]
  );

  const addUser = useCallback((userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setUsers((prev) => [...prev, newUser]);
    setFirestoreDoc('appUsers', newUser.id, newUser).catch(() => {});
    return newUser;
  }, []);

  const updateUser = useCallback((id: string, userData: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...userData } : u))
    );
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...userData }));
    }
    setFirestoreDoc('appUsers', id, userData).catch(() => {});
  }, [currentUser.id]);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    deleteFirestoreDoc('appUsers', id).catch(() => {});
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const user = await signInWithGooglePopup();
    if (user) {
      setIsLocked(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutFirebase();
    setIsLocked(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
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
