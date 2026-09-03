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
  const isVehicleAvailable = (vehicleId: string, startDate: string, endDate: string, excludeBookingId?: string): boolean => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const conflictingBookings = bookings.filter(b => {
      if (b.vehicleId !== vehicleId) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status === 'CANCELLED' || b.status === 'COMPLETED') return false;

      const bStart = new Date(b.startDate).getTime();
      const bEnd = new Date(b.endDate).getTime();

      return Math.max(start, bStart) <= Math.min(end, bEnd);
    });

    return conflictingBookings.length === 0;
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
    calculateBookingPricing,
    addBooking,
    updateBookingStatus,
    generateInvoice,
    startCheckInFlow,
    startCheckOutFlow,
  };
};
