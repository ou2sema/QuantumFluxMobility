import { CheckIn, CheckOut, MandatoryPhotos, DamageItem } from '../../types';

export interface InspectionComparisonResult {
  kmDriven: number;
  extraKm: number;
  extraKmCost: number;
  fuelVariance: number; // e.g. -20%
  missingFuelCost: number;
  newDamagesDetected: DamageItem[];
  damageCostTotal: number;
  totalSurcharges: number;
  netDepositRefund: number;
  photosComplete: boolean;
  missingPhotos: (keyof MandatoryPhotos)[];
}

/**
 * Validates if all mandatory inspection photos are present.
 */
export function validateMandatoryPhotos(photos: Partial<MandatoryPhotos> = {}): {
  isComplete: boolean;
  missing: (keyof MandatoryPhotos)[];
} {
  const requiredAngles: (keyof MandatoryPhotos)[] = [
    'front',
    'rear',
    'left',
    'right',
    'interior',
    'dashboard',
  ];

  const missing = requiredAngles.filter((angle) => !photos[angle] || photos[angle]?.trim() === '');
  return {
    isComplete: missing.length === 0,
    missing,
  };
}

/**
 * Compares pickup check-in state with return checkout state to identify discrepancies.
 */
export function compareInspections(
  checkIn: Partial<CheckIn>,
  returnInspection: {
    mileage: number;
    fuelLevel: number;
    photos: MandatoryPhotos;
    reportedDamages: DamageItem[];
  },
  rates: {
    includedKm?: number;
    excessKmRate: number; // e.g. 0.30 DT / km
    fuelMissingRatePerLiter: number; // e.g. 2.50 DT / L
    fuelTankCapacity: number; // e.g. 50 L
    depositCollected: number; // e.g. 1500 DT
  }
): InspectionComparisonResult {
  const startMileage = checkIn.mileage || 0;
  const returnMileage = returnInspection.mileage || startMileage;
  const kmDriven = Math.max(0, returnMileage - startMileage);

  // Calculate excess km
  const maxIncluded = rates.includedKm || 999999;
  const extraKm = Math.max(0, kmDriven - maxIncluded);
  const extraKmCost = Math.round(extraKm * rates.excessKmRate * 100) / 100;

  // Calculate fuel difference
  const startFuel = checkIn.fuelLevel ?? 100;
  const returnFuel = returnInspection.fuelLevel ?? 100;
  const fuelVariance = returnFuel - startFuel; // negative if returned with less

  let missingFuelCost = 0;
  if (fuelVariance < 0) {
    const missingPercentage = Math.abs(fuelVariance);
    const missingLiters = (missingPercentage / 100) * (rates.fuelTankCapacity || 50);
    missingFuelCost = Math.round(missingLiters * rates.fuelMissingRatePerLiter * 100) / 100;
  }

  // Damage comparison
  const existingDamages = checkIn.damages || [];
  const existingIds = new Set(existingDamages.map((d) => d.id));

  const newDamagesDetected = returnInspection.reportedDamages.filter(
    (d) => !existingIds.has(d.id) && !d.isPreExisting
  );

  const damageCostTotal = newDamagesDetected.reduce(
    (sum, d) => sum + (Number(d.estimatedCost) || 0),
    0
  );

  const totalSurcharges = Math.round((extraKmCost + missingFuelCost + damageCostTotal) * 100) / 100;
  const netDepositRefund = Math.max(0, Math.round((rates.depositCollected - totalSurcharges) * 100) / 100);

  const photoCheck = validateMandatoryPhotos(returnInspection.photos);

  return {
    kmDriven,
    extraKm,
    extraKmCost,
    fuelVariance,
    missingFuelCost,
    newDamagesDetected,
    damageCostTotal,
    totalSurcharges,
    netDepositRefund,
    photosComplete: photoCheck.isComplete,
    missingPhotos: photoCheck.missing,
  };
}
