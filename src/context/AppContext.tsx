import React, { createContext, useContext, useState, useEffect } from 'react';
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
  Vehicle,
  VehicleStatus,
} from '../types';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import { ToastProvider, useToast } from './ToastContext';
import { AuthProvider, useAuth } from './AuthContext';
import { AgencyProvider, useAgencies } from './AgencyContext';
import { FleetProvider, useFleet } from './FleetContext';
import { ClientProvider, useClients } from './ClientContext';
import { BookingProvider, useBookings } from './BookingContext';
import { MaintenanceProvider, useMaintenance } from './MaintenanceContext';
import { SyncProvider, useSync } from './SyncContext';

export interface AppContextType {
  // Auth & Security
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

  // Agencies
  currentAgency: Agency;
  agencies: Agency[];
  setCurrentAgency: (agency: Agency) => void;
  updateAgency: (agency: Agency) => void;

  // Fleet
  vehicles: Vehicle[];
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'damages'>) => Vehicle;
  updateVehicle: (vehicleId: string, vehicleData: Partial<Vehicle>) => void;
  deleteVehicle: (vehicleId: string) => void;
  updateVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  addVehicleDamage: (vehicleId: string, damage: Omit<DamageItem, 'id' | 'addedAt'>) => void;

  // Clients
  clients: Client[];
  addClient: (clientData: Omit<Client, 'id' | 'totalBookings' | 'documents' | 'createdAt'>) => Client;
  updateClient: (clientId: string, clientData: Partial<Client>) => void;

  // Bookings & Inspections
  bookings: Booking[];
  addBooking: (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => Booking;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  selectedBookingForCheckIn: Booking | null;
  setSelectedBookingForCheckIn: (booking: Booking | null) => void;
  selectedBookingForCheckOut: Booking | null;
  setSelectedBookingForCheckOut: (booking: Booking | null) => void;
  checkIns: CheckIn[];
  checkOuts: CheckOut[];
  completeCheckIn: (checkInData: Omit<CheckIn, 'id' | 'timestamp'>) => CheckIn;
  completeCheckOut: (checkOutData: Omit<CheckOut, 'id' | 'timestamp'>) => CheckOut;
  extras: ExtraItem[];
  generateInvoice: (bookingId: string) => Invoice;

  // Maintenance
  maintenances: MaintenanceRecord[];
  addMaintenanceRecord: (recordData: Omit<MaintenanceRecord, 'id'>) => MaintenanceRecord;
  updateMaintenanceRecord: (id: string, recordData: Partial<MaintenanceRecord>) => void;
  deleteMaintenanceRecord: (id: string) => void;

  // Sync & Offline
  isFirestoreConnected: boolean;
  firestoreError: string | null;
  isSyncingFirestore: boolean;
  lastFirestoreSync: string | null;
  syncAllToFirestore: () => Promise<{ success: boolean; error?: string; count: number }>;
  isOffline: boolean;
  setIsOffline: (val: boolean | ((prev: boolean) => boolean)) => void;
  pendingSyncCount: number;
  triggerSync: () => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  // Navigation tab state (kept synchronized with React Router)
  activeTab: 'dashboard' | 'bookings' | 'calendar' | 'fleet' | 'clients' | 'checkin' | 'checkout' | 'maintenance' | 'users' | 'reports' | 'client_portal';
  setActiveTab: (tab: 'dashboard' | 'bookings' | 'calendar' | 'fleet' | 'clients' | 'checkin' | 'checkout' | 'maintenance' | 'users' | 'reports' | 'client_portal') => void;
}

const CombinedAppContext = createContext<AppContextType | undefined>(undefined);

const CombinedBridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authSlice = useAuth();
  const agencySlice = useAgencies();
  const fleetSlice = useFleet();
  const clientSlice = useClients();
  const bookingSlice = useBookings();
  const maintenanceSlice = useMaintenance();
  const syncSlice = useSync();

  const [activeTab, setActiveTab] = useState<AppContextType['activeTab']>('dashboard');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('autofleet_pro_notifs');
    return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('autofleet_pro_notifs', JSON.stringify(notifications));
  }, [notifications]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const combinedValue: AppContextType = {
    ...authSlice,
    ...agencySlice,
    ...fleetSlice,
    ...clientSlice,
    ...bookingSlice,
    ...maintenanceSlice,
    ...syncSlice,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    activeTab,
    setActiveTab,
  };

  return (
    <CombinedAppContext.Provider value={combinedValue}>
      {children}
    </CombinedAppContext.Provider>
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AgencyProvider>
          <FleetProvider>
            <ClientProvider>
              <BookingProvider>
                <MaintenanceProvider>
                  <SyncProvider>
                    <CombinedBridgeProvider>{children}</CombinedBridgeProvider>
                  </SyncProvider>
                </MaintenanceProvider>
              </BookingProvider>
            </ClientProvider>
          </FleetProvider>
        </AgencyProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(CombinedAppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAppContext = useApp;

// Re-export specialized hooks for direct granular access
export { useToast } from './ToastContext';
export { useAuth } from './AuthContext';
export { useAgencies } from './AgencyContext';
export { useFleet } from './FleetContext';
export { useClients } from './ClientContext';
export { useBookings } from './BookingContext';
export { useMaintenance } from './MaintenanceContext';
export { useSync } from './SyncContext';
