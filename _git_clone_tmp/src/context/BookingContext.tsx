import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  updateBooking: (updatedBooking: Booking) => void;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  checkAndAutoUpdateBooking: (booking: Booking) => { updated: boolean; booking: Booking; reason?: 'AUTO_CANCELLED' | 'AUTO_COMPLETED' };
  checkAllBookingsLifecycle: () => number;
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
  cancelBooking: (
    bookingId: string,
    reason?: string,
    refundAmount?: number,
    cancellationFee?: number,
    cancelledBy?: string
  ) => Promise<{ success: boolean; error?: string }>;
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

      const targetBk = bookings.find((b) => b.id === bookingId);
      if (targetBk) {
        if (status === 'CANCELLED' || status === 'COMPLETED') {
          updateVehicleStatus(targetBk.vehicleId, 'AVAILABLE');
        } else if (status === 'IN_PROGRESS') {
          updateVehicleStatus(targetBk.vehicleId, 'RENTED');
        } else if (status === 'CONFIRMED') {
          updateVehicleStatus(targetBk.vehicleId, 'RESERVED');
        }
      }

      toast.info(`Statut de la réservation mis à jour : ${status}`);
    },
    [toast, bookings, updateVehicleStatus]
  );

  const updateBooking = useCallback((updatedBooking: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
    setFirestoreDoc('bookings', updatedBooking.id, updatedBooking).catch(() => {});
  }, []);

  // Automatically process booking lifecycle rules:
  // 1. If start day passed and client didn't check in -> auto-cancel & vehicle AVAILABLE
  // 2. If end day arrives/passed -> auto-complete & vehicle AVAILABLE
  const checkAndAutoUpdateBooking = useCallback(
    (booking: Booking): { updated: boolean; booking: Booking; reason?: 'AUTO_CANCELLED' | 'AUTO_COMPLETED' } => {
      const today = new Date().toISOString().split('T')[0];

      // Rule 1: Day passed and client didn't proceed with check-in
      if ((booking.status === 'CONFIRMED' || booking.status === 'PENDING') && booking.startDate < today) {
        const updatedBooking: Booking = { ...booking, status: 'CANCELLED' };

        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? updatedBooking : b))
        );
        setFirestoreDoc('bookings', booking.id, { status: 'CANCELLED' }).catch(() => {});
        updateVehicleStatus(booking.vehicleId, 'AVAILABLE');

        toast.warning(
          `Réservation ${booking.bookingNumber} annulée automatiquement : départ dépassé sans check-in. Véhicule ${booking.vehicleName || ''} libéré.`
        );

        return { updated: true, booking: updatedBooking, reason: 'AUTO_CANCELLED' };
      }

      // Rule 2: End day comes/passed and reservation is in progress
      if (booking.status === 'IN_PROGRESS' && booking.endDate <= today) {
        const updatedBooking: Booking = { ...booking, status: 'COMPLETED' };

        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? updatedBooking : b))
        );
        setFirestoreDoc('bookings', booking.id, { status: 'COMPLETED' }).catch(() => {});
        updateVehicleStatus(booking.vehicleId, 'AVAILABLE');

        toast.success(
          `Réservation ${booking.bookingNumber} clôturée automatiquement : fin de contrat atteinte. Véhicule ${booking.vehicleName || ''} libéré.`
        );

        return { updated: true, booking: updatedBooking, reason: 'AUTO_COMPLETED' };
      }

      return { updated: false, booking };
    },
    [toast, updateVehicleStatus]
  );

  // Batch sweep for all bookings in current state
  const checkAllBookingsLifecycle = useCallback((): number => {
    const today = new Date().toISOString().split('T')[0];
    let changedCount = 0;
    const vehiclesToFree: string[] = [];

    setBookings((prev) => {
      let hasChanges = false;
      const nextBookings = prev.map((b) => {
        if ((b.status === 'CONFIRMED' || b.status === 'PENDING') && b.startDate < today) {
          hasChanges = true;
          changedCount++;
          vehiclesToFree.push(b.vehicleId);
          setFirestoreDoc('bookings', b.id, { status: 'CANCELLED' }).catch(() => {});
          return { ...b, status: 'CANCELLED' as const };
        }
        if (b.status === 'IN_PROGRESS' && b.endDate <= today) {
          hasChanges = true;
          changedCount++;
          vehiclesToFree.push(b.vehicleId);
          setFirestoreDoc('bookings', b.id, { status: 'COMPLETED' }).catch(() => {});
          return { ...b, status: 'COMPLETED' as const };
        }
        return b;
      });

      return hasChanges ? nextBookings : prev;
    });

    if (vehiclesToFree.length > 0) {
      vehiclesToFree.forEach((vId) => {
        updateVehicleStatus(vId, 'AVAILABLE');
      });
    }

    return changedCount;
  }, [updateVehicleStatus]);

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
          description: `Location véhicule ${vehicle?.brand} ${vehicle?.model} (${booking.durationDays || 1} jours x ${(booking?.dailyRate || 0).toFixed(2)} DT)`,
          quantity: booking.durationDays || 1,
          unitPrice: booking.dailyRate || 0,
          total: booking.rentalSubtotal || 0,
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
        clientAddress: client?.address || 'Avenue Habib Bourguiba, 1000 Tunis',
        clientEmail: booking.clientEmail,
        vehicleInfo: `${vehicle?.brand} ${vehicle?.model} (${vehicle?.plate})`,
        agencyName: currentAgency.name,
        agencyAddress: currentAgency.address,
        date: new Date().toLocaleDateString('fr-FR'),
        dueDate: new Date().toLocaleDateString('fr-FR'),
        items: invoiceItems,
        subtotal: booking.rentalSubtotal + booking.extrasTotal,
        taxRate: 0.07, // 7% transport VAT Tunisia
        taxAmount: booking.tax,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        status: booking.paymentStatus === 'PAID' ? 'PAID' : 'ISSUED',
      };

      return invoice;
    },
    [bookings, clients, vehicles, extras, currentAgency]
  );

  const cancelBooking = useCallback(
    async (
      bookingId: string,
      reason: string = 'Annulation manuelle',
      refundAmount?: number,
      cancellationFee?: number,
      cancelledBy: string = 'Agent'
    ): Promise<{ success: boolean; error?: string }> => {
      const targetBk = bookings.find((b) => b.id === bookingId);
      if (!targetBk) {
        return { success: false, error: 'Réservation introuvable' };
      }

      const cancelledAt = new Date().toISOString();
      const updatedBooking: Booking = {
        ...targetBk,
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt,
        cancelledBy,
        cancellationFee: cancellationFee !== undefined ? cancellationFee : targetBk.cancellationFee,
        refundAmount: refundAmount !== undefined ? refundAmount : targetBk.refundAmount,
        paymentStatus:
          refundAmount !== undefined && refundAmount > 0
            ? refundAmount >= (targetBk.paidAmount || targetBk.totalAmount)
              ? 'REFUNDED'
              : 'PARTIALLY_PAID'
            : targetBk.paymentStatus === 'PAID'
            ? 'PAID'
            : 'CANCELLED',
        notes: targetBk.notes
          ? `${targetBk.notes}\n[Annulé le ${new Date().toLocaleDateString('fr-FR')}: ${reason}]`
          : `[Annulé le ${new Date().toLocaleDateString('fr-FR')}: ${reason}]`,
        updatedAt: cancelledAt,
      };

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updatedBooking : b))
      );

      try {
        await setFirestoreDoc('bookings', bookingId, updatedBooking);
      } catch (e) {
        console.warn('Failed to sync cancelled booking to Firestore:', e);
      }

      // Automatically release the vehicle back to AVAILABLE
      if (targetBk.vehicleId) {
        updateVehicleStatus(targetBk.vehicleId, 'AVAILABLE');
        const vehicle = vehicles.find((v) => v.id === targetBk.vehicleId);
        if (vehicle) {
          try {
            await setFirestoreDoc('vehicles', vehicle.id, {
              ...vehicle,
              status: 'AVAILABLE',
            });
          } catch (e) {}
        }
      }

      if (selectedBookingForCheckIn?.id === bookingId) {
        setSelectedBookingForCheckIn(null);
      }
      if (selectedBookingForCheckOut?.id === bookingId) {
        setSelectedBookingForCheckOut(null);
      }

      toast.success(
        `Réservation ${targetBk.bookingNumber} annulée avec succès. Véhicule ${targetBk.vehicleName || ''} libéré.`
      );
      return { success: true };
    },
    [
      bookings,
      vehicles,
      updateVehicleStatus,
      selectedBookingForCheckIn,
      selectedBookingForCheckOut,
      toast,
    ]
  );

  const contextValue = useMemo<BookingContextType>(
    () => ({
      bookings,
      addBooking,
      updateBooking,
      updateBookingStatus,
      checkAndAutoUpdateBooking,
      checkAllBookingsLifecycle,
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
      cancelBooking,
    }),
    [
      bookings,
      addBooking,
      updateBooking,
      updateBookingStatus,
      checkAndAutoUpdateBooking,
      checkAllBookingsLifecycle,
      selectedBookingForCheckIn,
      selectedBookingForCheckOut,
      checkIns,
      checkOuts,
      completeCheckIn,
      completeCheckOut,
      extras,
      generateInvoice,
      cancelBooking,
    ]
  );

  return (
    <BookingContext.Provider value={contextValue}>
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
