import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Agency,
  AppNotification,
  Booking,
  CheckIn,
  CheckOut,
  Client,
  DamageItem,
  ExtraItem,
  Invoice,
  MaintenanceRecord,
  User,
  UserRole,
  Vehicle,
  VehicleStatus
} from '../types';
import {
  MOCK_AGENCIES,
  MOCK_BOOKINGS,
  MOCK_CHECKINS,
  MOCK_CHECKOUTS,
  MOCK_CLIENTS,
  MOCK_EXTRAS,
  MOCK_MAINTENANCES,
  MOCK_NOTIFICATIONS,
  MOCK_USERS,
  MOCK_VEHICLES
} from '../data/mockData';
import {
  setFirestoreDoc,
  deleteFirestoreDoc,
  subscribeToCollection,
  pushAllCollectionsToFirestore,
  seedCollectionsIfEmpty,
} from '../lib/firebase';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (userData: Omit<User, 'id'>) => User;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  isFirestoreConnected: boolean;
  firestoreError: string | null;
  isSyncingFirestore: boolean;
  lastFirestoreSync: string | null;
  syncAllToFirestore: () => Promise<{ success: boolean; error?: string; count: number }>;
  
  // PIN Code Security & Lock Screen
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  lockApp: () => void;
  unlockWithPin: (pin: string, targetUserId?: string) => boolean;

  currentAgency: Agency;
  agencies: Agency[];
  setCurrentAgency: (agency: Agency) => void;
  vehicles: Vehicle[];
  clients: Client[];
  bookings: Booking[];
  checkIns: CheckIn[];
  checkOuts: CheckOut[];
  maintenances: MaintenanceRecord[];
  addMaintenanceRecord: (recordData: Omit<MaintenanceRecord, 'id'>) => MaintenanceRecord;
  updateMaintenanceRecord: (id: string, recordData: Partial<MaintenanceRecord>) => void;
  deleteMaintenanceRecord: (id: string) => void;
  extras: ExtraItem[];
  notifications: AppNotification[];
  isOffline: boolean;
  setIsOffline: (val: boolean | ((prev: boolean) => boolean)) => void;
  pendingSyncCount: number;
  triggerSync: () => void;
  
  // Active flow state for field agents
  activeTab: 'dashboard' | 'bookings' | 'fleet' | 'clients' | 'checkin' | 'checkout' | 'maintenance' | 'users' | 'reports' | 'client_portal';
  setActiveTab: (tab: 'dashboard' | 'bookings' | 'fleet' | 'clients' | 'checkin' | 'checkout' | 'maintenance' | 'users' | 'reports' | 'client_portal') => void;
  
  // Check-in & Check-out selected items
  selectedBookingForCheckIn: Booking | null;
  setSelectedBookingForCheckIn: (booking: Booking | null) => void;
  selectedBookingForCheckOut: Booking | null;
  setSelectedBookingForCheckOut: (booking: Booking | null) => void;

  // Actions
  addBooking: (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => Booking;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  addClient: (clientData: Omit<Client, 'id' | 'totalBookings' | 'documents' | 'createdAt'>) => Client;
  updateClient: (clientId: string, clientData: Partial<Client>) => void;
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'damages'>) => Vehicle;
  updateVehicle: (vehicleId: string, vehicleData: Partial<Vehicle>) => void;
  deleteVehicle: (vehicleId: string) => void;
  updateVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  addVehicleDamage: (vehicleId: string, damage: Omit<DamageItem, 'id' | 'addedAt'>) => void;
  completeCheckIn: (checkInData: Omit<CheckIn, 'id' | 'timestamp'>) => CheckIn;
  completeCheckOut: (checkOutData: Omit<CheckOut, 'id' | 'timestamp'>) => CheckOut;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  updateAgency: (agency: Agency) => void;
  generateInvoice: (bookingId: string) => Invoice;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'autofleet_pro_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or default to mock
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return MOCK_USERS[0];
      }
    }
    return MOCK_USERS[0]; // Admin by default
  });

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

  const [isLocked, setIsLocked] = useState<boolean>(true);

  const [agencies, setAgencies] = useState<Agency[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'agencies');
    return saved ? JSON.parse(saved) : MOCK_AGENCIES;
  });

  const [currentAgency, setCurrentAgency] = useState<Agency>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'current_agency');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return MOCK_AGENCIES[0];
      }
    }
    return MOCK_AGENCIES[0];
  });
  const [extras] = useState<ExtraItem[]>(MOCK_EXTRAS);

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'vehicles');
    return saved ? JSON.parse(saved) : MOCK_VEHICLES;
  });

  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'maintenances');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return MOCK_MAINTENANCES;
      }
    }
    return MOCK_MAINTENANCES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'clients');
    return saved ? JSON.parse(saved) : MOCK_CLIENTS;
  });

  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'checkins');
    return saved ? JSON.parse(saved) : MOCK_CHECKINS;
  });

  const [checkOuts, setCheckOuts] = useState<CheckOut[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'checkouts');
    return saved ? JSON.parse(saved) : MOCK_CHECKOUTS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'bookings');
    const parsed: Booking[] = saved ? JSON.parse(saved) : MOCK_BOOKINGS;
    const savedCheckIns = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'checkins');
    const existingCheckIns: CheckIn[] = savedCheckIns ? JSON.parse(savedCheckIns) : MOCK_CHECKINS;
    const savedCheckOuts = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'checkouts');
    const existingCheckOuts: CheckOut[] = savedCheckOuts ? JSON.parse(savedCheckOuts) : MOCK_CHECKOUTS;

    return parsed.map((b) => {
      const co = existingCheckOuts.find((c) => c.bookingId === b.id);
      if (co) {
        return { ...b, status: 'COMPLETED' as const, checkOutId: co.id };
      }
      const ci = existingCheckIns.find((c) => c.bookingId === b.id);
      if (ci && b.status === 'CONFIRMED') {
        return { ...b, status: 'IN_PROGRESS' as const, checkInId: ci.id };
      }
      return b;
    });
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'notifs');
    return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
  });

  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);
  const [lastFirestoreSync, setLastFirestoreSync] = useState<string | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'fleet' | 'clients' | 'checkin' | 'checkout' | 'maintenance' | 'users' | 'reports' | 'client_portal'>('dashboard');
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<Booking | null>(null);
  const [selectedBookingForCheckOut, setSelectedBookingForCheckOut] = useState<Booking | null>(null);

  // Function to explicitly push all current data to Firestore
  const syncAllToFirestore = useCallback(async () => {
    setIsSyncingFirestore(true);
    setFirestoreError(null);
    try {
      const res = await pushAllCollectionsToFirestore({
        vehicles,
        bookings,
        clients,
        maintenances,
        appUsers: users,
        checkIns,
        checkOuts,
        agencies,
      });
      if (res.success) {
        setIsFirestoreConnected(true);
        setLastFirestoreSync(new Date().toLocaleTimeString());
        setFirestoreError(null);
      } else {
        setFirestoreError(res.error || 'Erreur inconnue');
      }
      return res;
    } catch (err: any) {
      const msg = err?.message || String(err);
      setFirestoreError(msg);
      return { success: false, error: msg, count: 0 };
    } finally {
      setIsSyncingFirestore(false);
    }
  }, [vehicles, bookings, clients, maintenances, users, checkIns, checkOuts, agencies]);

  // Initialize and sync with Firebase Firestore
  useEffect(() => {
    let active = true;

    // Initialize Firestore dataset ONLY if collections are empty, ensuring existing records are preserved on reload
    const initFirestore = async () => {
      try {
        const res = await seedCollectionsIfEmpty({
          vehicles: MOCK_VEHICLES,
          bookings: MOCK_BOOKINGS,
          clients: MOCK_CLIENTS,
          maintenances: MOCK_MAINTENANCES,
          appUsers: MOCK_USERS,
          checkIns: MOCK_CHECKINS,
          checkOuts: MOCK_CHECKOUTS,
          agencies: MOCK_AGENCIES,
        });
        if (active) {
          if (res.success) {
            setIsFirestoreConnected(true);
            setLastFirestoreSync(new Date().toLocaleTimeString());
            setFirestoreError(null);
          } else {
            console.warn('Initial Firestore seed check failed:', res.error);
            setFirestoreError(res.error || 'Permissions insuffisantes');
          }
        }
      } catch (err: any) {
        console.warn('Firestore initial seeding error:', err);
        if (active) setFirestoreError(err?.message || 'Erreur de connexion Firestore');
      }
    };
    initFirestore();

    // Subscribe to collections for live real-time sync across devices
    const handleSubError = (err: Error) => {
      console.warn('Firestore subscription warning:', err);
      setFirestoreError(err.message);
    };

    const unsubVehicles = subscribeToCollection<Vehicle>('vehicles', (items) => {
      if (items && items.length > 0) setVehicles(items);
    }, handleSubError);

    const unsubBookings = subscribeToCollection<Booking>('bookings', (items) => {
      if (items && items.length > 0) {
        setBookings((prev) => {
          // Reconcile status: if a checkIn or checkOut exists, keep the booking in the correct status
          return items.map((item) => {
            const savedCheckOuts = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'checkouts');
            const localCheckOuts: CheckOut[] = savedCheckOuts ? JSON.parse(savedCheckOuts) : [];
            if (localCheckOuts.some((co) => co.bookingId === item.id) && item.status !== 'COMPLETED') {
              setFirestoreDoc('bookings', item.id, { status: 'COMPLETED' });
              return { ...item, status: 'COMPLETED' as const };
            }

            const savedCheckIns = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'checkins');
            const localCheckIns: CheckIn[] = savedCheckIns ? JSON.parse(savedCheckIns) : [];
            const hasCheckIn = localCheckIns.some((ci) => ci.bookingId === item.id) || prev.find((p) => p.id === item.id)?.checkInId;
            if (hasCheckIn && item.status === 'CONFIRMED') {
              setFirestoreDoc('bookings', item.id, { status: 'IN_PROGRESS' });
              return { ...item, status: 'IN_PROGRESS' as const };
            }

            return item;
          });
        });
      }
    }, handleSubError);

    const unsubClients = subscribeToCollection<Client>('clients', (items) => {
      if (items && items.length > 0) setClients(items);
    }, handleSubError);

    const unsubMaintenances = subscribeToCollection<MaintenanceRecord>('maintenances', (items) => {
      if (items && items.length > 0) setMaintenances(items);
    }, handleSubError);

    const unsubUsers = subscribeToCollection<User>('appUsers', (items) => {
      if (items && items.length > 0) setUsers(items);
    }, handleSubError);

    const unsubCheckIns = subscribeToCollection<CheckIn>('checkIns', (items) => {
      if (items && items.length > 0) {
        setCheckIns(items);
        // Ensure any booking that has a checkIn is marked as IN_PROGRESS
        setBookings((prev) =>
          prev.map((b) => {
            const matchingCheckIn = items.find((ci) => ci.bookingId === b.id);
            if (matchingCheckIn && b.status === 'CONFIRMED') {
              setFirestoreDoc('bookings', b.id, { status: 'IN_PROGRESS', checkInId: matchingCheckIn.id });
              return { ...b, status: 'IN_PROGRESS' as const, checkInId: matchingCheckIn.id };
            }
            return b;
          })
        );
      }
    }, handleSubError);

    const unsubCheckOuts = subscribeToCollection<CheckOut>('checkOuts', (items) => {
      if (items && items.length > 0) {
        setCheckOuts(items);
        // Ensure any booking that has a checkOut is marked as COMPLETED
        setBookings((prev) =>
          prev.map((b) => {
            const matchingCheckOut = items.find((co) => co.bookingId === b.id);
            if (matchingCheckOut && b.status !== 'COMPLETED') {
              setFirestoreDoc('bookings', b.id, { status: 'COMPLETED', checkOutId: matchingCheckOut.id });
              return { ...b, status: 'COMPLETED' as const, checkOutId: matchingCheckOut.id };
            }
            return b;
          })
        );
      }
    }, handleSubError);

    const unsubAgencies = subscribeToCollection<Agency>('agencies', (items) => {
      if (items && items.length > 0) {
        setAgencies(items);
        setCurrentAgency((curr) => items.find((a) => a.id === curr.id) || items[0]);
      }
    }, handleSubError);

    return () => {
      active = false;
      unsubVehicles();
      unsubBookings();
      unsubClients();
      unsubMaintenances();
      unsubUsers();
      unsubCheckIns();
      unsubCheckOuts();
      unsubAgencies();
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'maintenances', JSON.stringify(maintenances));
  }, [maintenances]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'checkins', JSON.stringify(checkIns));
  }, [checkIns]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'checkouts', JSON.stringify(checkOuts));
  }, [checkOuts]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'agencies', JSON.stringify(agencies));
  }, [agencies]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'current_agency', JSON.stringify(currentAgency));
  }, [currentAgency]);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = () => {
    setPendingSyncCount(0);
    // Add success notification
    const syncNotif: AppNotification = {
      id: `notif-sync-${Date.now()}`,
      type: 'NEW_BOOKING',
      title: 'Synchronisation terminée',
      message: 'Toutes les fiches et photos ont été synchronisées avec le serveur central.',
      time: 'À l’instant',
      read: false,
      severity: 'INFO',
    };
    setNotifications(prev => [syncNotif, ...prev]);
  };

  const addBooking = (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>): Booking => {
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const newBooking: Booking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      bookingNumber: `BK-2026-${randomSeq}`,
      createdAt: new Date().toISOString(),
      invoiceNumber: `INV-2026-${randomSeq}`,
    };

    setBookings(prev => [newBooking, ...prev]);
    setFirestoreDoc('bookings', newBooking.id, newBooking);
    
    // Update vehicle status if immediately rented
    if (newBooking.startDate === '2026-09-02' && newBooking.status === 'IN_PROGRESS') {
      updateVehicleStatus(newBooking.vehicleId, 'RENTED');
    }

    // Increment client totalBookings
    setClients(prev => {
      const updated = prev.map(c => {
        if (c.id === newBooking.clientId) {
          const u = { ...c, totalBookings: c.totalBookings + 1 };
          setFirestoreDoc('clients', u.id, { totalBookings: u.totalBookings });
          return u;
        }
        return c;
      });
      return updated;
    });

    if (isOffline) {
      setPendingSyncCount(prev => prev + 1);
    }

    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    setFirestoreDoc('bookings', bookingId, { status });
    if (isOffline) setPendingSyncCount(prev => prev + 1);
  };

  const addClient = (clientData: Omit<Client, 'id' | 'totalBookings' | 'documents' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      totalBookings: 0,
      documents: [],
      createdAt: new Date().toISOString(),
    };
    setClients(prev => [newClient, ...prev]);
    setFirestoreDoc('clients', newClient.id, newClient);
    if (isOffline) setPendingSyncCount(prev => prev + 1);
    return newClient;
  };

  const updateClient = (clientId: string, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...clientData } : c));
    setFirestoreDoc('clients', clientId, clientData);
    if (isOffline) setPendingSyncCount(prev => prev + 1);
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id' | 'damages'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `veh-${Date.now()}`,
      damages: [],
    };
    setVehicles(prev => [newVehicle, ...prev]);
    setFirestoreDoc('vehicles', newVehicle.id, newVehicle);

    const notif: AppNotification = {
      id: `notif-veh-add-${Date.now()}`,
      type: 'FLEET_ALERT',
      title: 'Véhicule ajouté à la flotte',
      message: `${newVehicle.brand} ${newVehicle.model} (${newVehicle.plate}) ajouté avec succès.`,
      time: 'À l’instant',
      read: false,
      severity: 'INFO',
    };
    setNotifications(prev => [notif, ...prev]);

    if (isOffline) setPendingSyncCount(prev => prev + 1);
    return newVehicle;
  };

  const updateVehicle = (vehicleId: string, vehicleData: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, ...vehicleData } : v));
    setFirestoreDoc('vehicles', vehicleId, vehicleData);
    if (isOffline) setPendingSyncCount(prev => prev + 1);
  };

  const deleteVehicle = (vehicleId: string) => {
    const target = vehicles.find(v => v.id === vehicleId);
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    deleteFirestoreDoc('vehicles', vehicleId);
    
    if (target) {
      const notif: AppNotification = {
        id: `notif-veh-del-${Date.now()}`,
        type: 'FLEET_ALERT',
        title: 'Véhicule retiré',
        message: `${target.brand} ${target.model} (${target.plate}) a été retiré de la flotte.`,
        time: 'À l’instant',
        read: false,
        severity: 'WARNING',
      };
      setNotifications(prev => [notif, ...prev]);
    }
    if (isOffline) setPendingSyncCount(prev => prev + 1);
  };

  const updateVehicleStatus = (vehicleId: string, status: VehicleStatus) => {
    const target = vehicles.find(v => v.id === vehicleId);
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status } : v));
    setFirestoreDoc('vehicles', vehicleId, { status });
    
    if (target) {
      const statusLabels: Record<VehicleStatus, string> = {
        AVAILABLE: 'Disponible',
        RENTED: 'Loué',
        MAINTENANCE: 'En Maintenance',
        UNAVAILABLE: 'Indisponible',
      };
      const notif: AppNotification = {
        id: `notif-veh-st-${Date.now()}`,
        type: 'FLEET_ALERT',
        title: 'Statut véhicule mis à jour',
        message: `${target.brand} ${target.model} (${target.plate}) est maintenant ${statusLabels[status]}.`,
        time: 'À l’instant',
        read: false,
        severity: status === 'MAINTENANCE' ? 'WARNING' : 'INFO',
      };
      setNotifications(prev => [notif, ...prev]);
    }
    
    if (isOffline) setPendingSyncCount(prev => prev + 1);
  };

  const addVehicleDamage = (vehicleId: string, damage: Omit<DamageItem, 'id' | 'addedAt'>) => {
    const newDamage: DamageItem = {
      ...damage,
      id: `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      addedAt: new Date().toISOString().split('T')[0],
    };
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const updatedDamages = [...v.damages, newDamage];
        setFirestoreDoc('vehicles', vehicleId, { damages: updatedDamages });
        return {
          ...v,
          damages: updatedDamages
        };
      }
      return v;
    }));
    if (isOffline) setPendingSyncCount(prev => prev + 1);
  };

  const completeCheckIn = (checkInData: Omit<CheckIn, 'id' | 'timestamp'>): CheckIn => {
    const checkIn: CheckIn = {
      ...checkInData,
      id: `chk-in-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Update booking to IN_PROGRESS
    setBookings(prev => prev.map(b => {
      if (b.id === checkIn.bookingId) {
        return {
          ...b,
          status: 'IN_PROGRESS',
          checkInId: checkIn.id,
        };
      }
      return b;
    }));
    setFirestoreDoc('bookings', checkIn.bookingId, { status: 'IN_PROGRESS', checkInId: checkIn.id });

    // Clear selected booking for check-in
    setSelectedBookingForCheckIn(null);

    // Update vehicle: status RENTED, mileage, fuel, damages
    setVehicles(prev => prev.map(v => {
      if (v.id === checkIn.vehicleId) {
        const updatedDamages = [...v.damages, ...checkIn.damages.filter(d => !d.isPreExisting)];
        setFirestoreDoc('vehicles', checkIn.vehicleId, {
          status: 'RENTED',
          mileage: checkIn.mileage,
          currentFuelLevel: checkIn.fuelLevel,
          damages: updatedDamages,
        });
        return {
          ...v,
          status: 'RENTED',
          mileage: checkIn.mileage,
          currentFuelLevel: checkIn.fuelLevel,
          damages: updatedDamages,
        };
      }
      return v;
    }));

    // Add to checkIns state & Firestore
    setCheckIns(prev => [checkIn, ...prev.filter(c => c.bookingId !== checkIn.bookingId)]);
    setFirestoreDoc('checkIns', checkIn.id, checkIn);

    // Notification
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'CHECKIN_DUE',
      title: 'Check-in validé',
      message: `Véhicule remis pour réservation ${checkIn.bookingNumber}. Caution ${checkIn.depositCollected} DT enregistrée.`,
      time: 'À l’instant',
      read: false,
      severity: 'INFO',
    };
    setNotifications(prev => [notif, ...prev]);

    if (isOffline) setPendingSyncCount(prev => prev + 1);
    return checkIn;
  };

  const completeCheckOut = (checkOutData: Omit<CheckOut, 'id' | 'timestamp'>): CheckOut => {
    const checkOut: CheckOut = {
      ...checkOutData,
      id: `chk-out-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Add to checkOuts state & Firestore
    setCheckOuts(prev => [checkOut, ...prev.filter(c => c.bookingId !== checkOut.bookingId)]);
    setFirestoreDoc('checkOuts', checkOut.id, checkOut);

    // Update booking to COMPLETED
    setBookings(prev => prev.map(b => {
      if (b.id === checkOut.bookingId) {
        return {
          ...b,
          status: 'COMPLETED',
          checkOutId: checkOut.id,
        };
      }
      return b;
    }));
    setFirestoreDoc('bookings', checkOut.bookingId, { status: 'COMPLETED', checkOutId: checkOut.id });

    // Clear selected booking for check-out
    setSelectedBookingForCheckOut(null);

    // Update vehicle: status AVAILABLE, mileage, fuel, add new damages
    setVehicles(prev => prev.map(v => {
      if (v.id === checkOut.vehicleId) {
        const updatedDamages = [...v.damages, ...checkOut.newDamages];
        setFirestoreDoc('vehicles', checkOut.vehicleId, {
          status: 'AVAILABLE',
          mileage: checkOut.mileage,
          currentFuelLevel: checkOut.fuelLevel,
          damages: updatedDamages,
        });
        return {
          ...v,
          status: 'AVAILABLE',
          mileage: checkOut.mileage,
          currentFuelLevel: checkOut.fuelLevel,
          damages: updatedDamages,
        };
      }
      return v;
    }));

    // Notification
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'CHECKOUT_DUE',
      title: 'Check-out clôturé',
      message: `Véhicule réceptionné pour ${checkOut.bookingNumber}. Caution restituée : ${checkOut.depositRefundAmount} DT.`,
      time: 'À l’instant',
      read: false,
      severity: 'INFO',
    };
    setNotifications(prev => [notif, ...prev]);

    if (isOffline) setPendingSyncCount(prev => prev + 1);
    return checkOut;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateAgency = (updated: Agency) => {
    setAgencies(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (currentAgency.id === updated.id) {
      setCurrentAgency(updated);
    }
    setFirestoreDoc('agencies', updated.id, updated);
    // Success notification
    const notif: AppNotification = {
      id: `notif-agency-${Date.now()}`,
      type: 'NEW_BOOKING',
      title: 'Établissement mis à jour',
      message: `Les informations de l’agence "${updated.name}" ont été actualisées avec succès.`,
      time: 'À l’instant',
      read: false,
      severity: 'INFO',
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const generateInvoice = (bookingId: string): Invoice => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');
    const client = clients.find(c => c.id === booking.clientId);
    const vehicle = vehicles.find(v => v.id === booking.vehicleId);

    const invoiceItems = [
      {
        description: `Location véhicule ${vehicle?.brand} ${vehicle?.model} (${booking.durationDays} jours x ${booking.dailyRate.toFixed(2)} DT)`,
        quantity: booking.durationDays,
        unitPrice: booking.dailyRate,
        total: booking.rentalSubtotal,
      },
      ...booking.selectedExtras.map(extId => {
        const ext = extras.find(e => e.id === extId);
        const daily = ext?.pricePerDay || 0;
        const total = daily * booking.durationDays;
        return {
          description: ext?.name || 'Option supplémentaire',
          quantity: booking.durationDays,
          unitPrice: daily,
          total: total,
        };
      })
    ];

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: booking.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingId: booking.id,
      clientName: booking.clientName,
      clientAddress: client?.address || '14 Rue de Rivoli, 75001 Paris',
      clientEmail: booking.clientEmail,
      vehicleInfo: `${vehicle?.brand} ${vehicle?.model} (${vehicle?.plate})`,
      agencyName: currentAgency.name,
      agencyAddress: currentAgency.address,
      date: new Date().toLocaleDateString('fr-FR'),
      dueDate: new Date().toLocaleDateString('fr-FR'),
      items: invoiceItems,
      subtotal: booking.rentalSubtotal + booking.extrasTotal,
      taxRate: 0.20,
      taxAmount: booking.tax,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
    };

    return invoice;
  };

  // User Management
  const addUser = (userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [newUser, ...prev]);
    setFirestoreDoc('appUsers', newUser.id, newUser);

    const notif: AppNotification = {
      id: `notif-user-${Date.now()}`,
      type: 'NEW_BOOKING',
      title: 'Nouvel utilisateur créé',
      message: `L'utilisateur ${newUser.name} (${newUser.role}) a été ajouté avec succès.`,
      time: 'À l’instant',
      read: false,
      severity: 'INFO',
    };
    setNotifications(prev => [notif, ...prev]);
    return newUser;
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
    setFirestoreDoc('appUsers', id, userData);
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...userData }));
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteFirestoreDoc('appUsers', id);
  };

  // PIN Security & Authentication
  const lockApp = () => {
    setIsLocked(true);
  };

  const unlockWithPin = (pin: string, targetUserId?: string): boolean => {
    let matchedUser: User | undefined;
    if (targetUserId) {
      const u = users.find(user => user.id === targetUserId);
      if (u && u.pinCode === pin) {
        matchedUser = u;
      }
    } else {
      // Find any user matching this PIN
      matchedUser = users.find(user => user.pinCode === pin);
    }

    if (matchedUser) {
      setCurrentUser(matchedUser);
      setIsLocked(false);
      try {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'user', JSON.stringify(matchedUser));
      } catch (e) {
        // Ignore storage errors
      }
      return true;
    }
    return false;
  };

  // Maintenance & Garage Workshop
  const addMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord => {
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: `maint-${Date.now()}`,
    };
    setMaintenances(prev => [newRecord, ...prev]);
    setFirestoreDoc('maintenances', newRecord.id, newRecord);

    // If mileage or nextDueDate was updated, refresh vehicle state
    if (recordData.nextDueMileage) {
      setVehicles(prev => prev.map(v => {
        if (v.id === recordData.vehicleId) {
          const updatePayload = {
            nextMaintenanceMileage: recordData.nextDueMileage,
            nextMaintenanceDate: recordData.nextDueDate || v.nextMaintenanceDate,
          };
          setFirestoreDoc('vehicles', v.id, updatePayload);
          return {
            ...v,
            ...updatePayload,
          };
        }
        return v;
      }));
    }

    const notif: AppNotification = {
      id: `notif-maint-${Date.now()}`,
      type: 'INSPECTION_ALERT',
      title: 'Entretien Enregistré',
      message: `${newRecord.title} effectué sur ${newRecord.vehiclePlate} (${newRecord.mileageAtService} km).`,
      time: 'À l’instant',
      read: false,
      severity: 'INFO',
    };
    setNotifications(prev => [notif, ...prev]);

    return newRecord;
  };

  const updateMaintenanceRecord = (id: string, recordData: Partial<MaintenanceRecord>) => {
    setMaintenances(prev => prev.map(m => m.id === id ? { ...m, ...recordData } : m));
    setFirestoreDoc('maintenances', id, recordData);
  };

  const deleteMaintenanceRecord = (id: string) => {
    setMaintenances(prev => prev.filter(m => m.id !== id));
    deleteFirestoreDoc('maintenances', id);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        isFirestoreConnected,
        firestoreError,
        isSyncingFirestore,
        lastFirestoreSync,
        syncAllToFirestore,
        isLocked,
        setIsLocked,
        lockApp,
        unlockWithPin,
        currentAgency,
        agencies,
        setCurrentAgency,
        vehicles,
        clients,
        bookings,
        checkIns,
        checkOuts,
        maintenances,
        addMaintenanceRecord,
        updateMaintenanceRecord,
        deleteMaintenanceRecord,
        extras,
        notifications,
        isOffline,
        setIsOffline,
        pendingSyncCount,
        triggerSync,
        activeTab,
        setActiveTab,
        selectedBookingForCheckIn,
        setSelectedBookingForCheckIn,
        selectedBookingForCheckOut,
        setSelectedBookingForCheckOut,
        addBooking,
        updateBookingStatus,
        addClient,
        updateClient,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        updateVehicleStatus,
        addVehicleDamage,
        completeCheckIn,
        completeCheckOut,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        updateAgency,
        generateInvoice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
