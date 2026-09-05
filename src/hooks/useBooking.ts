import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, Vehicle } from '../types';

export const useBooking = () => {
  const {
    bookings,
    vehicles,
    clients,
    extras,
    addBooking,
    updateBookingStatus,
    generateInvoice,
    setSelectedBookingForCheckIn,
    setSelectedBookingForCheckOut,
    setActiveTab,
  } = useApp();

  const todayStr = '2026-09-02';

  const todayCheckIns = useMemo(() => {
    return bookings.filter(b => b.startDate === todayStr && b.status === 'CONFIRMED');
  }, [bookings, todayStr]);

  const todayCheckOuts = useMemo(() => {
    return bookings.filter(b => b.endDate === todayStr && b.status === 'IN_PROGRESS');
  }, [bookings, todayStr]);

  const inProgressBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'IN_PROGRESS');
  }, [bookings]);

  const pendingBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'PENDING' || b.paymentStatus === 'PENDING');
  }, [bookings]);

  // Check if a vehicle is available for given date range
  const isVehicleAvailable = (
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
  };

  const getVehicleConflictInfo = (
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
  };

  const calculateBookingPricing = (
    vehicle: Vehicle,
    durationDays: number,
    selectedExtraIds: string[]
  ) => {
    const rentalSubtotal = vehicle.dailyRate * durationDays;
    const extrasTotal = selectedExtraIds.reduce((sum, extId) => {
      const extra = extras.find(e => e.id === extId);
      return sum + (extra ? extra.pricePerDay * durationDays : 0);
    }, 0);

    const subtotal = rentalSubtotal + extrasTotal;
    const tax = subtotal * 0.20; // 20% TVA
    const totalAmount = subtotal + tax;

    return {
      dailyRate: vehicle.dailyRate,
      durationDays,
      rentalSubtotal,
      extrasTotal,
      subtotal,
      tax,
      totalAmount,
      depositAmount: vehicle.depositAmount,
    };
  };

  const startCheckInFlow = (booking: Booking) => {
    setSelectedBookingForCheckIn(booking);
    setActiveTab('checkin');
  };

  const startCheckOutFlow = (booking: Booking) => {
    setSelectedBookingForCheckOut(booking);
    setActiveTab('checkout');
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
    startCheckInFlow,
    startCheckOutFlow,
  };
};
