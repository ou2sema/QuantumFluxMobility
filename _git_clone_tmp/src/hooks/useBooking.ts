import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Booking, Vehicle } from '../types';

export const useBooking = () => {
  const navigate = useNavigate();
  const {
    bookings,
    vehicles,
    clients,
    extras,
    addBooking,
    updateBookingStatus,
    generateInvoice,
    cancelBooking,
    setSelectedBookingForCheckIn,
    setSelectedBookingForCheckOut,
    setActiveTab,
  } = useApp();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayCheckIns = useMemo(() => {
    return bookings.filter(b => {
      const bStart = (b.startDate || '').split('T')[0];
      return (bStart === todayStr || (bStart <= todayStr && b.status === 'CONFIRMED')) &&
        (b.status === 'CONFIRMED' || b.status === 'PENDING');
    });
  }, [bookings, todayStr]);

  const todayCheckOuts = useMemo(() => {
    return bookings.filter(b => {
      const bEnd = (b.endDate || '').split('T')[0];
      return (bEnd === todayStr || (bEnd <= todayStr && (b.status === 'IN_PROGRESS' || b.status === 'ACTIVE'))) &&
        (b.status === 'IN_PROGRESS' || b.status === 'ACTIVE');
    });
  }, [bookings, todayStr]);

  const inProgressBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'IN_PROGRESS');
  }, [bookings]);

  const pendingBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'PENDING' || b.paymentStatus === 'PENDING');
  }, [bookings]);

  // Check if a vehicle is available for given date range
  const isVehicleAvailable = useCallback(
    (
      vehicleId: string,
      startDate: string,
      endDate: string,
      excludeBookingId?: string
    ): boolean => {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return false;

      // Hard block if vehicle is in maintenance or unavailable
      if (vehicle.status === 'MAINTENANCE' || vehicle.status === 'UNAVAILABLE') {
        return false;
      }

      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      if (isNaN(start) || isNaN(end) || start > end) {
        return false;
      }

      const conflictingBookings = bookings.filter((b) => {
        if (b.vehicleId !== vehicleId) return false;
        if (excludeBookingId && b.id === excludeBookingId) return false;
        if (b.status === 'CANCELLED' || b.status === 'COMPLETED') return false;

        const bStart = new Date(b.startDate).getTime();
        const bEnd = new Date(b.endDate).getTime();

        return Math.max(start, bStart) <= Math.min(end, bEnd);
      });

      if (conflictingBookings.length > 0) {
        return false;
      }

      // If vehicle status is currently RENTED or RESERVED and requested dates overlap with today
      const today = new Date().toISOString().split('T')[0];
      if ((vehicle.status === 'RENTED' || vehicle.status === 'RESERVED') && startDate <= today) {
        return false;
      }

      return true;
    },
    [vehicles, bookings]
  );

  const getVehicleConflictInfo = useCallback(
    (
      vehicleId: string,
      startDate?: string,
      endDate?: string,
      excludeBookingId?: string
    ): { hasConflict: boolean; reason: string | null; status: Vehicle['status'] } => {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) {
        return { hasConflict: true, reason: 'Véhicule introuvable', status: 'UNAVAILABLE' };
      }

      if (vehicle.status === 'MAINTENANCE') {
        return { hasConflict: true, reason: 'Véhicule en cours de maintenance technique', status: 'MAINTENANCE' };
      }

      if (vehicle.status === 'UNAVAILABLE') {
        return { hasConflict: true, reason: 'Véhicule hors service / indisponible', status: 'UNAVAILABLE' };
      }

      if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        const conflictingBooking = bookings.find((b) => {
          if (b.vehicleId !== vehicleId) return false;
          if (excludeBookingId && b.id === excludeBookingId) return false;
          if (b.status === 'CANCELLED' || b.status === 'COMPLETED') return false;

          const bStart = new Date(b.startDate).getTime();
          const bEnd = new Date(b.endDate).getTime();

          return Math.max(start, bStart) <= Math.min(end, bEnd);
        });

        if (conflictingBooking) {
          const isCurrentActive = conflictingBooking.status === 'IN_PROGRESS';
          return {
            hasConflict: true,
            reason: isCurrentActive
              ? `Déjà loué en cours (restitution prévue le ${conflictingBooking.endDate})`
              : `Déjà réservé pour cette période (${conflictingBooking.startDate} au ${conflictingBooking.endDate})`,
            status: isCurrentActive ? 'RENTED' : 'RESERVED',
          };
        }

        const today = new Date().toISOString().split('T')[0];
        if (vehicle.status === 'RENTED' && startDate <= today) {
          return { hasConflict: true, reason: 'Véhicule actuellement loué', status: 'RENTED' };
        }
        if (vehicle.status === 'RESERVED' && startDate <= today) {
          return { hasConflict: true, reason: 'Véhicule déjà réservé pour aujourd’hui', status: 'RESERVED' };
        }
      } else {
        if (vehicle.status === 'RENTED') {
          return { hasConflict: true, reason: 'Véhicule actuellement loué', status: 'RENTED' };
        }
        if (vehicle.status === 'RESERVED') {
          return { hasConflict: true, reason: 'Véhicule actuellement réservé', status: 'RESERVED' };
        }
      }

      return { hasConflict: false, reason: null, status: vehicle.status };
    },
    [vehicles, bookings]
  );

  const calculateBookingPricing = useCallback(
    (
      vehicle?: Vehicle | null,
      durationDays: number = 1,
      selectedExtraIds: string[] = []
    ) => {
      const dailyRate = vehicle?.dailyRate || 0;
      const depositAmount = vehicle?.depositAmount || 0;
      const days = Math.max(1, durationDays || 1);
      const rentalSubtotal = dailyRate * days;
      const extrasTotal = (selectedExtraIds || []).reduce((sum, extId) => {
        const extra = extras.find(e => e.id === extId);
        return sum + (extra ? (extra.pricePerDay || 0) * days : 0);
      }, 0);

      const subtotal = rentalSubtotal + extrasTotal;
      const tax = subtotal * 0.20; // 20% TVA
      const totalAmount = subtotal + tax;

      return {
        dailyRate,
        durationDays: days,
        rentalSubtotal,
        extrasTotal,
        subtotal,
        tax,
        totalAmount,
        depositAmount,
      };
    },
    [extras]
  );

  const startCheckInFlow = (booking: Booking) => {
    setSelectedBookingForCheckIn(booking);
    if (booking?.id) {
      navigate(`/checkin/${booking.id}`);
    } else {
      navigate('/checkin');
    }
  };

  const startCheckOutFlow = (booking: Booking) => {
    setSelectedBookingForCheckOut(booking);
    if (booking?.id) {
      navigate(`/checkout/${booking.id}`);
    } else {
      navigate('/checkout');
    }
  };

  return {
    bookings,
    todayCheckIns,
    todayCheckOuts,
    inProgressBookings,
    pendingBookings,
    isVehicleAvailable,
    getVehicleConflictInfo,
    calculateBookingPricing,
    addBooking,
    updateBookingStatus,
    generateInvoice,
    cancelBooking,
    startCheckInFlow,
    startCheckOutFlow,
  };
};
