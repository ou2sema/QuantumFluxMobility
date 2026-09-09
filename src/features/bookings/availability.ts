import { Booking, Vehicle, MaintenanceRecord } from '../../types';

export interface AvailabilityCheckOptions {
  excludeBookingId?: string;
  turnaroundBufferHours?: number; // e.g. 2 hours minimum turnaround
}

export interface ConflictDetails {
  type: 'BOOKING_OVERLAP' | 'MAINTENANCE_BLOCKED' | 'VEHICLE_STATUS_BLOCKED';
  reason: string;
  conflictingItem?: Booking | MaintenanceRecord;
}

/**
 * Checks if two time intervals overlap.
 */
export function areIntervalsOverlapping(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
  bufferMs: number = 0
): boolean {
  const bufferedStartB = new Date(startB.getTime() - bufferMs);
  const bufferedEndB = new Date(endB.getTime() + bufferMs);
  return startA < bufferedEndB && endA > bufferedStartB;
}

/**
 * Validates requested rental dates.
 */
export function validateRentalDates(startDateStr: string, endDateStr: string): { isValid: boolean; error?: string } {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'Date de début invalide' };
  }
  if (isNaN(end.getTime())) {
    return { isValid: false, error: 'Date de fin invalide' };
  }
  if (start >= end) {
    return { isValid: false, error: 'La date de retour doit être postérieure à la date de départ' };
  }

  return { isValid: true };
}

/**
 * Verifies vehicle availability against active bookings, scheduled maintenance, and vehicle status.
 */
export function isVehicleAvailable(
  vehicle: Vehicle,
  startDateStr: string,
  endDateStr: string,
  existingBookings: Booking[] = [],
  scheduledMaintenances: MaintenanceRecord[] = [],
  options: AvailabilityCheckOptions = {}
): { isAvailable: boolean; conflict?: ConflictDetails } {
  // 1. Check vehicle operational status
  const blockedStatuses = ['MAINTENANCE', 'BLOCKED', 'UNAVAILABLE'];
  if (blockedStatuses.includes(vehicle.status)) {
    return {
      isAvailable: false,
      conflict: {
        type: 'VEHICLE_STATUS_BLOCKED',
        reason: `Le véhicule est actuellement indisponible (Statut: ${vehicle.status})`,
      },
    };
  }

  // 2. Validate input dates
  const dateCheck = validateRentalDates(startDateStr, endDateStr);
  if (!dateCheck.isValid) {
    return {
      isAvailable: false,
      conflict: {
        type: 'BOOKING_OVERLAP',
        reason: dateCheck.error || 'Dates de réservation invalides',
      },
    };
  }

  const reqStart = new Date(startDateStr);
  const reqEnd = new Date(endDateStr);
  const bufferMs = (options.turnaroundBufferHours || 1) * 60 * 60 * 1000;

  // 3. Check against existing bookings for this vehicle
  const blockingBookingStatuses = ['CONFIRMED', 'IN_PROGRESS', 'ACTIVE', 'CHECKED_IN', 'PENDING'];

  const conflictingBooking = existingBookings.find((b) => {
    if (b.vehicleId !== vehicle.id) return false;
    if (options.excludeBookingId && b.id === options.excludeBookingId) return false;
    if (!blockingBookingStatuses.includes(b.status)) return false;

    const bStart = new Date(b.startDate);
    const bEnd = new Date(b.endDate);
    return areIntervalsOverlapping(reqStart, reqEnd, bStart, bEnd, bufferMs);
  });

  if (conflictingBooking) {
    return {
      isAvailable: false,
      conflict: {
        type: 'BOOKING_OVERLAP',
        reason: `Véhicule déjà réservé (Dossier ${conflictingBooking.bookingNumber}) du ${new Date(conflictingBooking.startDate).toLocaleDateString('fr-TN')} au ${new Date(conflictingBooking.endDate).toLocaleDateString('fr-TN')}`,
        conflictingItem: conflictingBooking,
      },
    };
  }

  // 4. Check against scheduled maintenances
  const conflictingMaintenance = scheduledMaintenances.find((m) => {
    if (m.vehicleId !== vehicle.id) return false;
    if (m.status === 'DONE' || m.status === 'COMPLETED') return false;

    const mDateStr = m.date || m.serviceDate || m.nextDueDate;
    if (!mDateStr) return false;

    const mStart = new Date(mDateStr);
    // Allocate a 24-hour maintenance block window if no explicit duration
    const mEnd = new Date(mStart.getTime() + 24 * 60 * 60 * 1000);

    return areIntervalsOverlapping(reqStart, reqEnd, mStart, mEnd);
  });

  if (conflictingMaintenance) {
    return {
      isAvailable: false,
      conflict: {
        type: 'MAINTENANCE_BLOCKED',
        reason: `Maintenance planifiée (${conflictingMaintenance.title || conflictingMaintenance.type})`,
        conflictingItem: conflictingMaintenance,
      },
    };
  }

  return { isAvailable: true };
}

/**
 * Filter fleet to only vehicles available during a time range.
 */
export function filterAvailableVehicles(
  vehicles: Vehicle[],
  startDateStr: string,
  endDateStr: string,
  existingBookings: Booking[] = [],
  scheduledMaintenances: MaintenanceRecord[] = []
): Vehicle[] {
  return vehicles.filter((v) => {
    const res = isVehicleAvailable(v, startDateStr, endDateStr, existingBookings, scheduledMaintenances);
    return res.isAvailable;
  });
}
