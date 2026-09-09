import { db } from '../../lib/firebase';
import { doc, setDoc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Booking, BookingStatus, Vehicle, MaintenanceRecord } from '../../types';
import { isVehicleAvailable } from './availability';
import { activityService } from '../activity/activity.service';
import { vehiclesService } from '../fleet/vehicles.service';

export interface CreateBookingPayload {
  booking: Booking;
  vehicle: Vehicle;
  existingBookings?: Booking[];
  scheduledMaintenances?: MaintenanceRecord[];
  actor: { id: string; name: string };
}

export const bookingsService = {
  /**
   * Creates a new booking with rigorous double-booking and status checks.
   */
  async createBooking({
    booking,
    vehicle,
    existingBookings = [],
    scheduledMaintenances = [],
    actor,
  }: CreateBookingPayload): Promise<{ success: boolean; error?: string }> {
    // 1. Conflict and availability check
    const check = isVehicleAvailable(
      vehicle,
      booking.startDate,
      booking.endDate,
      existingBookings,
      scheduledMaintenances
    );

    if (!check.isAvailable) {
      return {
        success: false,
        error: check.conflict?.reason || 'Véhicule non disponible sur la période demandée',
      };
    }

    // 2. Persist booking
    const bookingRef = doc(db, 'bookings', booking.id);
    await setDoc(bookingRef, {
      ...booking,
      createdAt: booking.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Update vehicle status if immediately confirmed or active
    if (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') {
      await vehiclesService.updateVehicleStatus(vehicle.id, 'RESERVED', actor);
    }

    // 4. Audit log
    await activityService.logAction(
      actor,
      'CREATED',
      'BOOKING',
      booking.id,
      `Réservation créée: ${booking.bookingNumber} (${booking.clientName} - ${vehicle.brand} ${vehicle.model}) pour ${booking.totalAmount} DT`
    );

    return { success: true };
  },

  /**
   * Updates booking status following the strict state machine lifecycle:
   * QUOTE -> PENDING -> CONFIRMED -> CHECKED_IN (ACTIVE) -> RETURNED -> COMPLETED / CANCELLED
   */
  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    vehicleId: string,
    actor: { id: string; name: string }
  ): Promise<void> {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // Synchronize vehicle state machine
    if (newStatus === 'CHECKED_IN' || newStatus === 'IN_PROGRESS' || newStatus === 'ACTIVE') {
      await vehiclesService.updateVehicleStatus(vehicleId, 'RENTED', actor);
    } else if (newStatus === 'RETURNED') {
      await vehiclesService.updateVehicleStatus(vehicleId, 'INSPECTION', actor);
    } else if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
      await vehiclesService.updateVehicleStatus(vehicleId, 'AVAILABLE', actor);
    }

    await activityService.logAction(
      actor,
      'STATUS_CHANGED',
      'BOOKING',
      bookingId,
      `Statut du dossier ${bookingId} mis à jour vers: ${newStatus}`
    );
  },
};
