import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Booking, CheckIn, CheckOut, ExtraItem, Invoice, Vehicle } from '../types';
import { MOCK_BOOKINGS, MOCK_CHECKINS, MOCK_CHECKOUTS, MOCK_EXTRAS } from '../data/mockData';
import { setFirestoreDoc, subscribeToCollection } from '../lib/firebase';
import { useToast } from './ToastContext';
import { useFleet } from './FleetContext';
import { useClients } from './ClientContext';
import { useAgencies } from './AgencyContext';

interface BookingContextType {
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
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);
const LOCAL_STORAGE_PREFIX = 'autofleet_pro_';

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { vehicles, updateVehicleStatus } = useFleet();
  const { clients } = useClients();
  const { currentAgency } = useAgencies();

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'bookings');
    return saved ? JSON.parse(saved) : MOCK_BOOKINGS;
  });

  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'checkins');
    return saved ? JSON.parse(saved) : MOCK_CHECKINS;
  });

  const [checkOuts, setCheckOuts] = useState<CheckOut[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'checkouts');
    return saved ? JSON.parse(saved) : MOCK_CHECKOUTS;
  });

  const [extras] = useState<ExtraItem[]>(MOCK_EXTRAS);

  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<Booking | null>(null);
  const [selectedBookingForCheckOut, setSelectedBookingForCheckOut] = useState<Booking | null>(null);

  // Firestore sync subscriptions
  useEffect(() => {
    const unsubBookings = subscribeToCollection<Booking>('bookings', (items) => {
      if (items && items.length > 0) {
        setBookings(items);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'bookings', JSON.stringify(items));
      }
    });

    const unsubCheckIns = subscribeToCollection<CheckIn>('checkIns', (items) => {
      if (items && items.length > 0) {
        setCheckIns(items);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'checkins', JSON.stringify(items));
      }
    });

    const unsubCheckOuts = subscribeToCollection<CheckOut>('checkOuts', (items) => {
      if (items && items.length > 0) {
        setCheckOuts(items);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'checkouts', JSON.stringify(items));
      }
    });

    return () => {
      unsubBookings();
      unsubCheckIns();
      unsubCheckOuts();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'checkins', JSON.stringify(checkIns));
  }, [checkIns]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'checkouts', JSON.stringify(checkOuts));
  }, [checkOuts]);

  const addBooking = useCallback(
    (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>): Booking => {
      const id = `b-${Date.now()}`;
      const bookingNumber = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newBooking: Booking = {
        ...bookingData,
        id,
        bookingNumber,
        createdAt: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      setFirestoreDoc('bookings', id, newBooking).catch(() => {});
      updateVehicleStatus(newBooking.vehicleId, 'RESERVED');

      toast.success(`Réservation ${bookingNumber} créée avec succès (véhicule réservé)`);
      return newBooking;
    },
    [toast, updateVehicleStatus]
  );

  const updateBookingStatus = useCallback(
    (bookingId: string, status: Booking['status']) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
      setFirestoreDoc('bookings', bookingId, { status }).catch(() => {});

      if (status === 'CANCELLED') {
        const targetBk = bookings.find((b) => b.id === bookingId);
        if (targetBk) {
          updateVehicleStatus(targetBk.vehicleId, 'AVAILABLE');
        }
      }

      toast.info(`Statut de la réservation mis à jour : ${status}`);
    },
    [toast, bookings, updateVehicleStatus]
  );

  const completeCheckIn = useCallback(
    (checkInData: Omit<CheckIn, 'id' | 'timestamp'>): CheckIn => {
      const checkIn: CheckIn = {
        ...checkInData,
        id: `chk-in-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      setCheckIns((prev) => [checkIn, ...prev.filter((c) => c.bookingId !== checkIn.bookingId)]);
      setFirestoreDoc('checkIns', checkIn.id, checkIn).catch(() => {});

      // Update booking to IN_PROGRESS
      setBookings((prev) =>
        prev.map((b) =>
          b.id === checkIn.bookingId
            ? { ...b, status: 'IN_PROGRESS', checkInId: checkIn.id }
            : b
        )
      );
      setFirestoreDoc('bookings', checkIn.bookingId, { status: 'IN_PROGRESS', checkInId: checkIn.id }).catch(() => {});

      // Mark vehicle as rented
      updateVehicleStatus(checkIn.vehicleId, 'RENTED');
      setSelectedBookingForCheckIn(null);

      toast.success(`Départ validé pour la réservation ${checkIn.bookingNumber}`);
      return checkIn;
    },
    [toast, updateVehicleStatus]
  );

  const completeCheckOut = useCallback(
    (checkOutData: Omit<CheckOut, 'id' | 'timestamp'>): CheckOut => {
      const checkOut: CheckOut = {
        ...checkOutData,
        id: `chk-out-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      setCheckOuts((prev) => [checkOut, ...prev.filter((c) => c.bookingId !== checkOut.bookingId)]);
      setFirestoreDoc('checkOuts', checkOut.id, checkOut).catch(() => {});

      // Update booking to COMPLETED
      setBookings((prev) =>
        prev.map((b) =>
          b.id === checkOut.bookingId
            ? { ...b, status: 'COMPLETED', checkOutId: checkOut.id }
            : b
        )
      );
      setFirestoreDoc('bookings', checkOut.bookingId, { status: 'COMPLETED', checkOutId: checkOut.id }).catch(() => {});

      // Return vehicle to AVAILABLE
      updateVehicleStatus(checkOut.vehicleId, 'AVAILABLE');
      setSelectedBookingForCheckOut(null);

      toast.success(`Retour clôturé pour la réservation ${checkOut.bookingNumber}`);
      return checkOut;
    },
    [toast, updateVehicleStatus]
  );

  const generateInvoice = useCallback(
    (bookingId: string): Invoice => {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');
      const client = clients.find((c) => c.id === booking.clientId);
      const vehicle = vehicles.find((v) => v.id === booking.vehicleId);

      const invoiceItems = [
        {
          description: `Location véhicule ${vehicle?.brand} ${vehicle?.model} (${booking.durationDays} jours x ${booking.dailyRate.toFixed(2)} €)`,
          quantity: booking.durationDays,
          unitPrice: booking.dailyRate,
          total: booking.rentalSubtotal,
        },
        ...booking.selectedExtras.map((extId) => {
          const ext = extras.find((e) => e.id === extId);
          const daily = ext?.pricePerDay || 0;
          return {
            description: ext?.name || 'Option supplémentaire',
            quantity: booking.durationDays,
            unitPrice: daily,
            total: daily * booking.durationDays,
          };
        }),
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
        taxRate: 0.2,
        taxAmount: booking.tax,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
      };

      return invoice;
    },
    [bookings, clients, vehicles, extras, currentAgency]
  );

  return (
    <BookingContext.Provider
      value={{
        bookings,
        addBooking,
        updateBookingStatus,
        selectedBookingForCheckIn,
        setSelectedBookingForCheckIn,
        selectedBookingForCheckOut,
        setSelectedBookingForCheckOut,
        checkIns,
        checkOuts,
        completeCheckIn,
        completeCheckOut,
        extras,
        generateInvoice,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};
