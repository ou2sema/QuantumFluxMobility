import { BookingPricingBreakdown } from '../../types';

export interface PricingOptions {
  baseDailyRate: number;
  startDate: string; // YYYY-MM-DD or ISO
  endDate: string; // YYYY-MM-DD or ISO
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  hasGps?: boolean;
  hasChildSeat?: boolean;
  hasExtraDriver?: boolean;
  hasFullInsurance?: boolean;
  discountCode?: string;
  isVipClient?: boolean;
  customDiscountAmount?: number;
  depositAmount?: number;
  currency?: 'TND' | 'EUR';
}

// Tunisian Daily Extras Rates (in TND / DT)
export const EXTRAS_RATES_TND = {
  GPS: 15,
  CHILD_SEAT: 12,
  EXTRA_DRIVER: 15,
  FULL_INSURANCE: 25, // All-risk zero-deductible insurance
};

export function calculateBookingPrice(options: PricingOptions): BookingPricingBreakdown {
  const {
    baseDailyRate,
    startDate,
    endDate,
    startTime = '10:00',
    endTime = '10:00',
    hasGps = false,
    hasChildSeat = false,
    hasExtraDriver = false,
    hasFullInsurance = false,
    isVipClient = false,
    customDiscountAmount = 0,
    depositAmount = 1000,
    currency = 'TND',
  } = options;

  // Calculate duration in days with 2-hour tolerance window
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  
  let durationMs = end.getTime() - start.getTime();
  if (durationMs < 0 || isNaN(durationMs)) {
    durationMs = 24 * 60 * 60 * 1000; // minimum 1 day fallback
  }

  const exactDays = durationMs / (1000 * 60 * 60 * 24);
  // Any fractional day past 2 hours counts as an additional rental day
  let durationDays = Math.max(1, Math.ceil(exactDays - 0.083));

  // Seasonality multiplier (e.g. Summer June-August in Tunisia +15%)
  const startMonth = start.getMonth(); // 0-11
  let seasonalMultiplier = 1.0;
  if (startMonth >= 5 && startMonth <= 7) {
    // Peak summer season in Tunisia
    seasonalMultiplier = 1.15;
  }

  // Long-term duration discount
  let durationDiscountPercent = 0;
  if (durationDays >= 14) {
    durationDiscountPercent = 0.15; // 15% off for 2+ weeks
  } else if (durationDays >= 7) {
    durationDiscountPercent = 0.10; // 10% off for 1+ week
  }

  if (isVipClient) {
    durationDiscountPercent = Math.max(durationDiscountPercent, 0.12);
  }

  // Base rental calculations
  const effectiveDailyRate = baseDailyRate * seasonalMultiplier;
  const rawSubtotal = effectiveDailyRate * durationDays;
  const percentDiscount = rawSubtotal * durationDiscountPercent;
  const discountAmount = Math.round((percentDiscount + customDiscountAmount) * 100) / 100;
  const rentalSubtotal = Math.max(0, rawSubtotal - discountAmount);

  // Extras calculations
  let extrasPerDay = 0;
  if (hasGps) extrasPerDay += EXTRAS_RATES_TND.GPS;
  if (hasChildSeat) extrasPerDay += EXTRAS_RATES_TND.CHILD_SEAT;
  if (hasExtraDriver) extrasPerDay += EXTRAS_RATES_TND.EXTRA_DRIVER;

  const extrasTotal = extrasPerDay * durationDays;
  const insuranceTotal = hasFullInsurance ? EXTRAS_RATES_TND.FULL_INSURANCE * durationDays : 0;

  // Tax in Tunisia (Standard 7% for transport/car rental service, or 19% standard VAT)
  const taxableBase = rentalSubtotal + extrasTotal + insuranceTotal;
  const taxAmount = Math.round(taxableBase * 0.07 * 100) / 100;
  const totalAmount = Math.round((taxableBase + taxAmount) * 100) / 100;

  return {
    durationDays,
    baseDailyRate,
    rentalSubtotal: Math.round(rentalSubtotal * 100) / 100,
    seasonalMultiplier,
    weekendMultiplier: 1.0,
    extrasTotal,
    insuranceTotal,
    discountAmount,
    taxAmount,
    totalAmount,
    depositAmount,
    currency,
  };
}
