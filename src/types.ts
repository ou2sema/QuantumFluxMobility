export type UserRole = 
  | 'ADMIN' 
  | 'AGENT_COMPTOIR' 
  | 'AGENT_TECHNIQUE';

export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE' | 'RESERVED';
export type VehicleCategory = 'CITADINE' | 'COMPACTE' | 'BERLINE' | 'SUV' | 'UTILITAIRE' | 'PREMIUM' | 'ELECTRIQUE';
export type FuelType = 'ESSENCE' | 'DIESEL' | 'HYBRIDE' | 'ELECTRIQUE';
export type Transmission = 'MANUELLE' | 'AUTOMATIQUE';

export type BookingStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
export type PaymentMethod = 'STRIPE_CARD' | 'CASH' | 'TRANSFER';
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'PARTIAL';

export type DamageZone = 'FRONT' | 'REAR' | 'LEFT' | 'RIGHT' | 'ROOF' | 'WINDSHIELD' | 'WHEELS' | 'INTERIOR';
export type DamageType = 'SCRATCH' | 'DENT' | 'CRACK' | 'STAIN' | 'BROKEN_PART' | 'OTHER';
export type DamageSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agencyId: string;
  pinCode: string; // 4 or 6 digits PIN for security access
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  active?: boolean;
  createdAt?: string;
}

export type MaintenanceType = 
  | 'VIDANGE' 
  | 'PLAQUETTES_FREIN' 
  | 'DISQUES_FREIN'
  | 'PNEUMATIQUES' 
  | 'FILTRES' 
  | 'CONTROLE_TECHNIQUE' 
  | 'REVISION_GENERALE' 
  | 'AUTRE';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleName?: string;
  type: MaintenanceType;
  title: string;
  description?: string;
  cost: number;
  mileageAtService?: number;
  mileage?: number;
  serviceDate?: string;
  date?: string;
  nextDueMileage?: number;
  nextDueDate?: string;
  technicianName?: string;
  performedBy?: string;
  garageName?: string;
  garage?: string;
  invoiceRef?: string;
  status: 'DONE' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED';
}

export interface Agency {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  openHours: string;
  coordinates: { lat: number; lng: number };
}

export interface ClientDocument {
  id: string;
  type: 'PERMIS_RECTO' | 'PERMIS_VERSO' | 'PIECE_IDENTITE' | 'JUSTIFICATIF_DOMICILE';
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  isLicenseExpiringSoon?: boolean; // If < 30 days
  birthDate: string;
  address: string;
  city: string;
  vipStatus?: boolean;
  notes?: string;
  totalBookings: number;
  documents: ClientDocument[];
  createdAt: string;
}

export interface DamageItem {
  id: string;
  zone: DamageZone;
  x?: number; // % coordinates on diagram
  y?: number;
  type: DamageType;
  severity: DamageSeverity;
  description: string;
  photoUrl?: string;
  addedAt: string;
  addedByCheckType: 'CHECK_IN' | 'CHECK_OUT' | 'MANUAL';
  estimatedCost?: number;
  isPreExisting?: boolean;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  plate: string;
  vin: string;
  color: string;
  doors: number;
  seats: number;
  fuelType: FuelType;
  fuelTankCapacity: number; // in Liters or kWh
  currentFuelLevel: number; // 0 to 100%
  mileage: number;
  transmission: Transmission;
  dailyRate: number;
  depositAmount: number;
  excessKmRate: number; // Cost per excess km in DT, e.g. 0.25
  fuelMissingRatePerLiter: number; // e.g. 2.50
  status: VehicleStatus;
  images: string[];
  agencyId: string;
  damages: DamageItem[];
  features: string[];
  nextMaintenanceDate?: string;
  nextMaintenanceMileage?: number;
}

export interface ExtraItem {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  iconName: string;
  category: 'EQUIPMENT' | 'INSURANCE' | 'SERVICE';
}

export interface Booking {
  id: string;
  bookingNumber: string; // e.g., "BK-2026-0812"
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  vehicleImageUrl: string;
  agencyId: string;
  startDate: string; // ISO String
  endDate: string; // ISO String
  startTime: string; // "10:00"
  endTime: string; // "18:00"
  dailyRate: number;
  durationDays: number;
  includedKm: number; // e.g. 250km/day
  selectedExtras: string[]; // Extra IDs
  extrasTotal: number;
  rentalSubtotal: number;
  tax: number;
  totalAmount: number;
  depositAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  checkInId?: string;
  checkOutId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface MandatoryPhotos {
  front: string;
  rear: string;
  left: string;
  right: string;
  interior: string;
  dashboard: string;
}

export interface LicenseOcrResult {
  number: string;
  fullName: string;
  expiryDate: string;
  category: string;
  isValid: boolean;
  confidence: number;
}

export interface CheckIn {
  id: string;
  bookingId: string;
  bookingNumber: string;
  vehicleId: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  mileage: number;
  fuelLevel: number; // 0-100%
  photos: MandatoryPhotos;
  licensePhotoUrl: string;
  licenseOcrData: LicenseOcrResult;
  damages: DamageItem[];
  signatureDataUrl: string;
  depositCollected: number;
  depositPaymentMethod: 'STRIPE_CARD' | 'CASH';
  notes?: string;
}

export interface CheckOut {
  id: string;
  bookingId: string;
  bookingNumber: string;
  vehicleId: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  mileage: number;
  startMileage: number;
  extraKm: number;
  extraKmCost: number;
  fuelLevel: number;
  startFuelLevel: number;
  missingFuelPercentage: number;
  missingFuelCost: number;
  photos: MandatoryPhotos;
  newDamages: DamageItem[];
  damageCost: number;
  totalSurcharges: number;
  depositRefundAmount: number;
  signatureDataUrl: string;
  dischargeAgreed: boolean;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0042"
  bookingId: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  vehicleInfo: string;
  agencyName: string;
  agencyAddress: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // 20%
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}

export interface AppNotification {
  id: string;
  type: 'CHECKIN_DUE' | 'CHECKOUT_DUE' | 'LICENSE_EXPIRING' | 'MAINTENANCE_DUE' | 'NEW_BOOKING' | 'OVERDUE_RETURN' | 'FLEET_ALERT' | 'INSPECTION_ALERT';
  title: string;
  message: string;
  time: string;
  read: boolean;
  targetId?: string;
  severity: 'INFO' | 'WARNING' | 'ALERT';
}
