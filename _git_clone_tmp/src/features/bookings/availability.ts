import { Booking, Vehicle, MaintenanceRecord } from '../../types';

export interface AvailabilityCheckResult {
  available: boolean;
  reason?: string;
  conflictingBooking?: Booking;
  conflictingMaintenance?: MaintenanceRecord;
}

/**
 * Checks if two date-time ranges overlap.
 * Range 1: [startA, endA]
 * Range 2: [startB, endB]
 */
export function doIntervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  // Overlap occurs if startA < endB AND endA > startB
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

/**
 * Parses date + optional time string into a valid Date object.
 */
export function parseBookingDateTime(dateStr: string, timeStr = '10:00'): Date {
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  return new Date(`${cleanDate}T${timeStr}`);
}

/**
 * Section 16: Centralized Availability Engine
 * Considers booking dates, pickup/return time, existing bookings, vehicle status, maintenance, and blocked periods.
 */
export function checkVehicleAvailability(
  vehicle: Vehicle,
  startDateStr: string,
  endDateStr: string,
  startTimeStr = '10:00',
  endTimeStr = '10:00',
  existingBookings: Booking[] = [],
  maintenances: MaintenanceRecord[] = [],
  ignoreBookingId?: string
): AvailabilityCheckResult {
  // 1. Vehicle status check
  if (vehicle.status === 'BLOCKED') {
    return {
      available: false,
      reason: 'Le véhicule est actuellement bloqué par l\'administration.',
    };
  }

  if (vehicle.status === 'MAINTENANCE') {
    return {
      available: false,
      reason: 'Le véhicule est actuellement immobilisé en atelier mécanique.',
    };
  }

  const reqStart = parseBookingDateTime(startDateStr, startTimeStr);
  const reqEnd = parseBookingDateTime(endDateStr, endTimeStr);

  if (reqEnd.getTime() <= reqStart.getTime()) {
    return {
      available: false,
      reason: 'La date/heure de retour doit être strictement postérieure au départ.',
    };
  }

  // 2. Overlapping Bookings Check (Double-Booking Protection)
  // Non-cancelled and non-completed bookings that overlap the requested period
  const activeBookings = existingBookings.filter((b) => {
    if (b.vehicleId !== vehicle.id) return false;
    if (ignoreBookingId && b.id === ignoreBookingId) return false;
    // Exclude cancelled bookings
    if (b.status === 'CANCELLED') return false;
    return true;
  });

  for (const booking of activeBookings) {
    const bStart = parseBookingDateTime(booking.startDate, booking.startTime);
    const bEnd = parseBookingDateTime(booking.endDate, booking.endTime);

    if (doIntervalsOverlap(reqStart, reqEnd, bStart, bEnd)) {
      return {
        available: false,
        reason: `Conflit de réservation : le véhicule est déjà réservé pour le contrat #${booking.bookingNumber} (${booking.startDate} au ${booking.endDate}).`,
        conflictingBooking: booking,
      };
    }
  }

  // 3. Maintenance Schedules Check
  const activeMaintenances = maintenances.filter(
    (m) => m.vehicleId === vehicle.id && m.status !== 'COMPLETED' && m.status !== 'DONE'
  );

  for (const m of activeMaintenances) {
    const mDateStr = m.scheduledDate || m.nextDueDate || m.date || m.serviceDate;
    if (mDateStr) {
      const mDate = new Date(mDateStr);
      // Assume maintenance blocks a 24h window
      const mStart = new Date(mDate.getTime());
      const mEnd = new Date(mDate.getTime() + 24 * 60 * 60 * 1000);

      if (doIntervalsOverlap(reqStart, reqEnd, mStart, mEnd)) {
        return {
          available: false,
          reason: `Immobilisation programmée pour maintenance : ${m.title} prévue le ${mDateStr}.`,
          conflictingMaintenance: m,
        };
      }
    }
  }

  return { available: true };
}

/**
 * Returns list of vehicles that are available for a given window
 */
export function getAvailableVehicles(
  allVehicles: Vehicle[],
  startDateStr: string,
  endDateStr: string,
  startTimeStr = '10:00',
  endTimeStr = '10:00',
  existingBookings: Booking[] = [],
  maintenances: MaintenanceRecord[] = []
): Vehicle[] {
  return allVehicles.filter((v) => {
    const res = checkVehicleAvailability(
      v,
      startDateStr,
      endDateStr,
      startTimeStr,
      endTimeStr,
      existingBookings,
      maintenances
    );
    return res.available;
  });
}
