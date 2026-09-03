import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Booking, CheckIn, CheckOut, DamageItem, LicenseOcrResult, MandatoryPhotos, Vehicle } from '../types';

export const useCheckIn = () => {
  const { completeCheckIn, completeCheckOut, vehicles, bookings, currentUser } = useApp();

  const [mandatoryPhotos, setMandatoryPhotos] = useState<MandatoryPhotos>({
    front: '',
    rear: '',
    left: '',
    right: '',
    interior: '',
    dashboard: '',
  });

  const [damages, setDamages] = useState<DamageItem[]>([]);
  const [mileage, setMileage] = useState<number>(0);
  const [fuelLevel, setFuelLevel] = useState<number>(100);
  const [licensePhotoUrl, setLicensePhotoUrl] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<LicenseOcrResult | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositMethod, setDepositMethod] = useState<'STRIPE_CARD' | 'CASH'>('STRIPE_CARD');

  const initForBooking = (booking: Booking, vehicle: Vehicle) => {
    setMileage(vehicle.mileage);
    setFuelLevel(vehicle.currentFuelLevel);
    setDepositAmount(vehicle.depositAmount);
    setDamages(vehicle.damages);
    setMandatoryPhotos({
      front: '',
      rear: '',
      left: '',
      right: '',
      interior: '',
      dashboard: '',
    });
    setSignatureDataUrl('');
    setLicensePhotoUrl('');
    setOcrResult(null);
  };

  const isPhotosComplete = Boolean(
    mandatoryPhotos.front &&
    mandatoryPhotos.rear &&
    mandatoryPhotos.left &&
    mandatoryPhotos.right &&
    mandatoryPhotos.interior &&
    mandatoryPhotos.dashboard
  );

  const performCheckIn = (booking: Booking, vehicle: Vehicle): CheckIn => {
    return completeCheckIn({
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      vehicleId: vehicle.id,
      agentId: currentUser.id,
      agentName: currentUser.name,
      mileage,
      fuelLevel,
      photos: mandatoryPhotos,
      licensePhotoUrl: licensePhotoUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      licenseOcrData: ocrResult || {
        number: '24AB910248',
        fullName: booking.clientName,
        expiryDate: '2031-04-12',
        category: 'B',
        isValid: true,
        confidence: 0.98,
      },
      damages,
      signatureDataUrl,
      depositCollected: depositAmount,
      depositPaymentMethod: depositMethod,
    });
  };

  const calculateCheckOutSurcharges = (
    booking: Booking,
    vehicle: Vehicle,
    returnMileage: number,
    returnFuelLevel: number,
    newDamagesList: DamageItem[]
  ) => {
    const initialMileage = vehicle.mileage;
    const drivenKm = Math.max(0, returnMileage - initialMileage);
    const includedKm = booking.includedKm;
    const extraKm = Math.max(0, drivenKm - includedKm);
    const extraKmCost = extraKm * vehicle.excessKmRate;

    const initialFuel = 100; // Expected full tank
    const missingFuelPercent = Math.max(0, initialFuel - returnFuelLevel);
    const missingLiters = (missingFuelPercent / 100) * vehicle.fuelTankCapacity;
    const missingFuelCost = missingLiters * vehicle.fuelMissingRatePerLiter;

    const damageCost = newDamagesList.reduce((acc, d) => acc + (d.estimatedCost || 0), 0);
    const totalSurcharges = extraKmCost + missingFuelCost + damageCost;
    const depositRefundAmount = Math.max(0, booking.depositAmount - totalSurcharges);

    return {
      initialMileage,
      returnMileage,
      drivenKm,
      includedKm,
      extraKm,
      extraKmCost,
      missingFuelPercent,
      missingLiters,
      missingFuelCost,
      damageCost,
      totalSurcharges,
      depositRefundAmount,
    };
  };

  return {
    mandatoryPhotos,
    setMandatoryPhotos,
    damages,
    setDamages,
    mileage,
    setMileage,
    fuelLevel,
    setFuelLevel,
    licensePhotoUrl,
    setLicensePhotoUrl,
    ocrResult,
    setOcrResult,
    signatureDataUrl,
    setSignatureDataUrl,
    depositAmount,
    setDepositAmount,
    depositMethod,
    setDepositMethod,
    initForBooking,
    isPhotosComplete,
    performCheckIn,
    calculateCheckOutSurcharges,
    completeCheckOut,
  };
};
