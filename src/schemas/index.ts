import { z } from 'zod';

export const clientFormSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse e-mail invalide'),
  phone: z.string().min(6, 'Numéro de téléphone invalide'),
  drivingLicenseNumber: z.string().min(5, 'Numéro de permis requis'),
  licenseExpiryDate: z.string().optional(),
  country: z.string().default('France'),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const bookingFormSchema = z
  .object({
    vehicleId: z.string().min(1, 'Veuillez sélectionner un véhicule'),
    clientId: z.string().min(1, 'Veuillez sélectionner ou créer un client'),
    startDate: z.string().min(1, 'Date de départ requise'),
    endDate: z.string().min(1, 'Date de retour requise'),
    pickupLocation: z.string().min(1, 'Lieu de prise en charge requis'),
    returnLocation: z.string().min(1, 'Lieu de restitution requis'),
    insuranceTier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
    dailyRate: z.number().min(1, 'Le tarif journalier doit être supérieur à 0'),
    depositAmount: z.number().min(0, 'Le dépôt de garantie doit être positif'),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end >= start;
    },
    {
      message: 'La date de retour doit être égale ou postérieure à la date de départ',
      path: ['endDate'],
    }
  );

export type BookingFormData = z.infer<typeof bookingFormSchema>;

export const vehicleFormSchema = z.object({
  brand: z.string().min(2, 'Marque requise'),
  model: z.string().min(1, 'Modèle requis'),
  plate: z.string().min(4, 'Immatriculation invalide (ex: AA-123-BB)'),
  category: z.string().min(1, 'Catégorie requise'),
  year: z.number().min(2000).max(2030),
  mileage: z.number().min(0, 'Le kilométrage doit être positif'),
  dailyRate: z.number().min(1, 'Le tarif journalier doit être au moins 1€'),
  fuelType: z.enum(['ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE']),
  fuelCapacityLiters: z.number().min(1).default(50),
  currentFuelLevel: z.number().min(0).max(100).default(100),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED']).default('AVAILABLE'),
  agencyId: z.string().default('agency-1'),
});

export type VehicleFormData = z.infer<typeof vehicleFormSchema>;

export const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, 'Véhicule requis'),
  type: z.enum(['SERVICE', 'REPAIR', 'INSPECTION', 'TIRES', 'CLEANING']),
  title: z.string().min(3, 'Description de l\'intervention requise'),
  cost: z.number().min(0, 'Le coût doit être positif'),
  scheduledDate: z.string().min(1, 'Date requise'),
  serviceProvider: z.string().min(2, 'Prestataire requis'),
  notes: z.string().optional(),
});

export type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;
