import { BookingStatus, VehicleStatus } from '../../types';

// Section 13: Booking Lifecycle & Valid State Transitions
const VALID_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  QUOTE: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'IN_PROGRESS', 'ACTIVE'],
  CHECKED_IN: ['ACTIVE', 'CANCELLED', 'IN_PROGRESS'],
  ACTIVE: ['RETURNED', 'CANCELLED', 'COMPLETED'],
  IN_PROGRESS: ['RETURNED', 'CANCELLED', 'COMPLETED'],
  RETURNED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_BOOKING_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

// Section 14: Vehicle Lifecycle Transitions
// AVAILABLE -> RESERVED -> PREPARING -> RENTED -> RETURNED -> INSPECTION -> (AVAILABLE or MAINTENANCE)
const VALID_VEHICLE_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  AVAILABLE: ['RESERVED', 'PREPARING', 'RENTED', 'MAINTENANCE', 'BLOCKED', 'UNAVAILABLE'],
  RESERVED: ['AVAILABLE', 'PREPARING', 'RENTED', 'BLOCKED'],
  PREPARING: ['RENTED', 'AVAILABLE', 'BLOCKED'],
  RENTED: ['RETURNED'],
  RETURNED: ['INSPECTION', 'AVAILABLE'],
  INSPECTION: ['AVAILABLE', 'MAINTENANCE', 'PREPARING'],
  MAINTENANCE: ['AVAILABLE', 'INSPECTION', 'BLOCKED'],
  BLOCKED: ['AVAILABLE', 'MAINTENANCE'],
  UNAVAILABLE: ['AVAILABLE', 'MAINTENANCE'],
};

export function canTransitionVehicle(from: VehicleStatus, to: VehicleStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_VEHICLE_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function getNextVehicleStatusAfterInspection(hasDamage: boolean): VehicleStatus {
  return hasDamage ? 'MAINTENANCE' : 'AVAILABLE';
}
