import { Vehicle, Booking, MaintenanceRecord, DamageRecord, VehicleProfitability } from '../../types';

/**
 * Calculates profitability metrics for a single vehicle or entire fleet.
 */
export function calculateVehicleProfitability(
  vehicle: Vehicle,
  bookings: Booking[] = [],
  maintenances: MaintenanceRecord[] = [],
  damages: DamageRecord[] = [],
  periodDays: number = 365
): VehicleProfitability {
  // 1. Calculate revenue from completed or active bookings
  const vehicleBookings = bookings.filter(
    (b) => b.vehicleId === vehicle.id && b.status !== 'CANCELLED'
  );

  const totalRevenue = vehicleBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  // 2. Calculate maintenance costs
  const vehicleMaintenances = maintenances.filter((m) => m.vehicleId === vehicle.id);
  const totalMaintenanceCost = vehicleMaintenances.reduce(
    (sum, m) => sum + (Number(m.cost) || 0),
    0
  );

  // 3. Calculate damage repair costs
  const vehicleDamages = damages.filter((d) => d.vehicleId === vehicle.id);
  const totalDamageCost = vehicleDamages.reduce(
    (sum, d) => sum + (Number(d.repairCost) || 0),
    0
  );

  // 4. Calculate rental days
  const rentalDays = vehicleBookings.reduce((sum, b) => {
    const days = b.durationDays || 1;
    return sum + days;
  }, 0);

  const totalDays = Math.max(1, periodDays);
  const utilizationRate = Math.min(100, Math.round((rentalDays / totalDays) * 1000) / 10);
  const netContribution = Math.round((totalRevenue - (totalMaintenanceCost + totalDamageCost)) * 100) / 100;
  const revenuePerAvailableDay = Math.round((totalRevenue / totalDays) * 100) / 100;

  return {
    vehicleId: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    plate: vehicle.plate,
    totalRevenue,
    totalMaintenanceCost,
    totalDamageCost,
    netContribution,
    rentalDays,
    totalDays,
    utilizationRate,
    revenuePerAvailableDay,
  };
}

/**
 * Computes fleet-wide aggregate profitability.
 */
export function calculateFleetProfitability(
  vehicles: Vehicle[],
  bookings: Booking[] = [],
  maintenances: MaintenanceRecord[] = [],
  damages: DamageRecord[] = []
): {
  fleetTotals: {
    totalRevenue: number;
    totalMaintenanceCost: number;
    totalDamageCost: number;
    totalNetContribution: number;
    averageUtilizationRate: number;
  };
  perVehicle: VehicleProfitability[];
} {
  const perVehicle = vehicles.map((v) =>
    calculateVehicleProfitability(v, bookings, maintenances, damages)
  );

  const totalRevenue = perVehicle.reduce((acc, v) => acc + v.totalRevenue, 0);
  const totalMaintenanceCost = perVehicle.reduce((acc, v) => acc + v.totalMaintenanceCost, 0);
  const totalDamageCost = perVehicle.reduce((acc, v) => acc + v.totalDamageCost, 0);
  const totalNetContribution = perVehicle.reduce((acc, v) => acc + v.netContribution, 0);
  const averageUtilizationRate =
    perVehicle.length > 0
      ? Math.round((perVehicle.reduce((acc, v) => acc + v.utilizationRate, 0) / perVehicle.length) * 10) / 10
      : 0;

  return {
    fleetTotals: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalDamageCost: Math.round(totalDamageCost * 100) / 100,
      totalNetContribution: Math.round(totalNetContribution * 100) / 100,
      averageUtilizationRate,
    },
    perVehicle,
  };
}
