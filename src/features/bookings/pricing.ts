import { Vehicle, ExtraItem } from '../../types';

export interface PricingCalculationResult {
  dailyRate: number;
  durationDays: number;
  baseRentalTotal: number;
  discountPercentage: number;
  discountAmount: number;
  discountedRentalTotal: number;
  extrasBreakdown: {
    extraId: string;
    name: string;
    dailyPrice: number;
    total: number;
  }[];
  extrasTotal: number;
  subtotalHt: number;
  vatRate: number; // 0.19 or 0.20
  vatAmount: number;
  totalTtc: number;
  depositAmount: number;
  currency: 'DT';
}

/**
 * Calculates long-duration discount:
 * 3-6 days: 5%
 * 7-13 days: 10%
 * 14-29 days: 15%
 * 30+ days: 20%
 */
export function calculateDurationDiscount(durationDays: number): number {
  if (durationDays >= 30) return 20;
  if (durationDays >= 14) return 15;
  if (durationDays >= 7) return 10;
  if (durationDays >= 3) return 5;
  return 0;
}

/**
 * Centralized pricing calculation engine for AUTORENT CAR TUNISIA.
 * All financial math is strictly validated and rounded to 2 decimal places.
 */
export function calculateBookingPrice(
  vehicle: Pick<Vehicle, 'dailyRate' | 'depositAmount' | 'category'>,
  durationDays: number,
  selectedExtras: ExtraItem[] = [],
  customDiscountPercent: number = 0,
  vatRate: number = 0.19
): PricingCalculationResult {
  const days = Math.max(1, Math.round(durationDays));
  const dailyRate = Number(vehicle.dailyRate) || 0;
  const baseRentalTotal = Math.round(dailyRate * days * 100) / 100;

  // Compute discount (maximum between duration discount and custom agent discount)
  const autoDiscount = calculateDurationDiscount(days);
  const effectiveDiscountPercent = Math.min(50, Math.max(autoDiscount, customDiscountPercent));
  const discountAmount = Math.round((baseRentalTotal * (effectiveDiscountPercent / 100)) * 100) / 100;
  const discountedRentalTotal = Math.max(0, Math.round((baseRentalTotal - discountAmount) * 100) / 100);

  // Compute extras
  const extrasBreakdown = selectedExtras.map((extra) => {
    const extraDaily = Number(extra.pricePerDay) || 0;
    const total = Math.round(extraDaily * days * 100) / 100;
    return {
      extraId: extra.id,
      name: extra.name,
      dailyPrice: extraDaily,
      total,
    };
  });

  const extrasTotal = extrasBreakdown.reduce((sum, item) => sum + item.total, 0);
  const subtotalHt = Math.round((discountedRentalTotal + extrasTotal) * 100) / 100;

  // VAT computation
  const vatAmount = Math.round(subtotalHt * vatRate * 100) / 100;
  const totalTtc = Math.round((subtotalHt + vatAmount) * 100) / 100;

  // Deposit based on vehicle default or category baseline
  const depositAmount = vehicle.depositAmount || 1500;

  return {
    dailyRate,
    durationDays: days,
    baseRentalTotal,
    discountPercentage: effectiveDiscountPercent,
    discountAmount,
    discountedRentalTotal,
    extrasBreakdown,
    extrasTotal,
    subtotalHt,
    vatRate,
    vatAmount,
    totalTtc,
    depositAmount,
    currency: 'DT',
  };
}
