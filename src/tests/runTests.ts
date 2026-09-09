/**
 * Automated test suite for AUTORENT CAR TUNISIA core business engines.
 * Run with: npm run test
 */

import { calculateBookingPrice, calculateDurationDiscount } from '../features/bookings/pricing';
import { isVehicleAvailable, areIntervalsOverlapping } from '../features/bookings/availability';
import { compareInspections, validateMandatoryPhotos } from '../features/inspections/inspectionComparator';
import { calculateVehicleProfitability } from '../features/fleet/profitability';
import { Vehicle, Booking, MaintenanceRecord } from '../types';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${errorDetail ? `-> ${errorDetail}` : ''}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING AUTORENT CAR TUNISIA TEST SUITE');
  console.log('======================================================\n');

  // --- TEST 1: Pricing Engine & Discounts ---
  console.log('--- 1. Pricing Engine & Discount Calculation ---');
  const mockVehicle: Vehicle = {
    id: 'v-101',
    brand: 'Peugeot',
    model: '208',
    year: 2024,
    category: 'CITADINE',
    plate: '234-TUN-5678',
    vin: 'VF3CC234567',
    color: 'Blanc Banquise',
    doors: 5,
    seats: 5,
    fuelType: 'ESSENCE',
    fuelTankCapacity: 45,
    currentFuelLevel: 100,
    mileage: 18500,
    transmission: 'MANUELLE',
    dailyRate: 95,
    depositAmount: 1500,
    excessKmRate: 0.35,
    fuelMissingRatePerLiter: 2.7,
    status: 'AVAILABLE',
    images: [],
    agencyId: 'agency-tunis',
    damages: [],
    features: ['Climatisation', 'Bluetooth'],
  };

  const p1 = calculateBookingPrice(mockVehicle, 2);
  assert(p1.baseRentalTotal === 190, 'Base price 2 days @ 95 DT = 190 DT');
  assert(p1.discountPercentage === 0, 'No discount for 2 days');

  const p7 = calculateBookingPrice(mockVehicle, 7);
  assert(p7.discountPercentage === 10, '10% discount for 7 days rental');
  assert(p7.discountAmount === 66.5, 'Discount amount = 66.5 DT (10% of 665)');
  assert(p7.totalTtc > p7.subtotalHt, 'Total TTC includes 19% VAT');

  // --- TEST 2: Double-Booking Prevention & Availability ---
  console.log('\n--- 2. Double-Booking Prevention & Availability ---');
  const existingBooking: Booking = {
    id: 'bk-999',
    bookingNumber: 'BK-2026-999',
    clientId: 'cl-1',
    clientName: 'Sami Ben Amor',
    clientPhone: '+216 98 123 456',
    clientEmail: 'sami@example.com',
    vehicleId: 'v-101',
    vehicleName: 'Peugeot 208',
    vehiclePlate: '234-TUN-5678',
    vehicleImageUrl: '',
    agencyId: 'agency-tunis',
    startDate: '2026-09-15T09:00:00.000Z',
    endDate: '2026-09-20T18:00:00.000Z',
    startTime: '09:00',
    endTime: '18:00',
    dailyRate: 95,
    durationDays: 5,
    includedKm: 1250,
    selectedExtras: [],
    extrasTotal: 0,
    rentalSubtotal: 475,
    tax: 90.25,
    totalAmount: 565.25,
    depositAmount: 1500,
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    status: 'CONFIRMED',
    createdAt: '2026-09-01T10:00:00.000Z',
  };

  // Overlapping request (in the middle of booking)
  const overlapCheck = isVehicleAvailable(
    mockVehicle,
    '2026-09-17T10:00:00.000Z',
    '2026-09-22T10:00:00.000Z',
    [existingBooking],
    []
  );
  assert(!overlapCheck.isAvailable, 'Correctly blocks overlapping rental dates');
  assert(overlapCheck.conflict?.type === 'BOOKING_OVERLAP', 'Identifies conflict as BOOKING_OVERLAP');

  // Non-overlapping request (after previous booking)
  const freeCheck = isVehicleAvailable(
    mockVehicle,
    '2026-09-22T10:00:00.000Z',
    '2026-09-25T10:00:00.000Z',
    [existingBooking],
    []
  );
  assert(freeCheck.isAvailable, 'Allows booking when dates are completely clear');

  // Blocked vehicle status check
  const maintenanceVehicle: Vehicle = { ...mockVehicle, status: 'MAINTENANCE' };
  const maintenanceCheck = isVehicleAvailable(
    maintenanceVehicle,
    '2026-10-01T10:00:00.000Z',
    '2026-10-05T10:00:00.000Z',
    [],
    []
  );
  assert(!maintenanceCheck.isAvailable, 'Blocks booking for vehicle in MAINTENANCE status');

  // --- TEST 3: Inspection Comparator & Mandatory Photos ---
  console.log('\n--- 3. Inspection Comparator & Photo Verification ---');
  const checkInState = {
    mileage: 18500,
    fuelLevel: 100,
    damages: [],
  };

  const returnInspection = {
    mileage: 19100, // 600 km driven
    fuelLevel: 75, // 25% missing
    photos: {
      front: 'https://storage/front.jpg',
      rear: 'https://storage/rear.jpg',
      left: 'https://storage/left.jpg',
      right: 'https://storage/right.jpg',
      interior: 'https://storage/interior.jpg',
      dashboard: 'https://storage/dashboard.jpg',
    },
    reportedDamages: [
      {
        id: 'dmg-1',
        zone: 'FRONT' as const,
        type: 'SCRATCH' as const,
        severity: 'LOW' as const,
        description: 'Rayure pare-chocs avant gauche',
        addedAt: new Date().toISOString(),
        addedByCheckType: 'CHECK_OUT' as const,
        estimatedCost: 120,
        isPreExisting: false,
      },
    ],
  };

  const comparison = compareInspections(checkInState, returnInspection, {
    includedKm: 500, // 100 km excess
    excessKmRate: 0.35, // 35 DT for excess km
    fuelMissingRatePerLiter: 2.7,
    fuelTankCapacity: 45, // 25% of 45L = 11.25L * 2.7 = 30.38 DT
    depositCollected: 1500,
  });

  assert(comparison.kmDriven === 600, 'Calculates 600 km total driven');
  assert(comparison.extraKm === 100, 'Calculates 100 km excess over allowance');
  assert(comparison.extraKmCost === 35, 'Excess km surcharge = 35 DT');
  assert(comparison.missingFuelCost > 30, 'Calculates missing fuel surcharge accurately');
  assert(comparison.newDamagesDetected.length === 1, 'Identifies 1 new damage incurred during rental');
  assert(comparison.photosComplete === true, 'Validates that all 6 mandatory photo angles are captured');

  // Photo missing check
  const incompletePhotos = validateMandatoryPhotos({ front: 'front.jpg' });
  assert(!incompletePhotos.isComplete, 'Detects missing mandatory photos');
  assert(incompletePhotos.missing.includes('dashboard'), 'Identifies missing dashboard photo');

  // --- TEST 4: Vehicle Profitability Engine ---
  console.log('\n--- 4. Vehicle Profitability Metrics ---');
  const mockMaintenances: MaintenanceRecord[] = [
    {
      id: 'm-1',
      vehicleId: 'v-101',
      vehiclePlate: '234-TUN-5678',
      type: 'VIDANGE',
      title: 'Vidange huile moteur 15000 km',
      cost: 180,
      status: 'DONE',
    },
  ];

  const prof = calculateVehicleProfitability(mockVehicle, [existingBooking], mockMaintenances, []);
  assert(prof.totalRevenue === 565.25, 'Records vehicle total revenue accurately');
  assert(prof.totalMaintenanceCost === 180, 'Records vehicle total maintenance cost');
  assert(prof.netContribution === 565.25 - 180, 'Calculates correct net contribution');
  assert(prof.rentalDays === 5, 'Records 5 rental days for period');

  // --- SUMMARY ---
  console.log('\n======================================================');
  console.log(`TEST RUN COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite();
