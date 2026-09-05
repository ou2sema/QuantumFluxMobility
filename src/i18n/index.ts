import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  fr: {
    translation: {
      nav: {
        dashboard: 'Tableau de bord',
        bookings: 'Réservations',
        calendar: 'Calendrier',
        fleet: 'Flotte',
        clients: 'Clients',
        maintenance: 'Atelier',
        reports: 'Rapports',
        portal: 'Portail Client',
        checkin: 'Départ',
        checkout: 'Retour',
        settings: 'Paramètres',
        installApp: 'Installer l\'App',
      },
      dashboard: {
        title: 'Tableau de bord Opérationnel',
        quickActions: 'Actions Rapides',
        newBooking: 'Nouvelle Réservation',
        scanPlate: 'Scanner Plaque',
        departuresToday: 'Départs prévus aujourd\'hui',
        returnsToday: 'Retours attendus aujourd\'hui',
        availableVehicles: 'Véhicules Disponibles',
        fleetStatus: 'État du Parc',
        occupancyRate: 'Taux d\'occupation',
        totalFleet: 'Total Flotte',
      },
      calendar: {
        title: 'Planning des Réservations',
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        today: 'Aujourd\'hui',
        filterCategory: 'Catégorie',
        allCategories: 'Toutes les catégories',
        filterStatus: 'Statut',
        allStatuses: 'Tous les statuts',
        noBookingsThisDay: 'Aucune réservation ce jour',
      },
      status: {
        AVAILABLE: 'Disponible',
        RENTED: 'En Location',
        MAINTENANCE: 'En Atelier',
        RESERVED: 'Réservé',
        CONFIRMED: 'Confirmée',
        IN_PROGRESS: 'En cours',
        COMPLETED: 'Terminée',
        CANCELLED: 'Annulée',
      },
      auth: {
        locked: 'Application Verrouillée',
        enterPin: 'Entrez votre code PIN agent',
        unlock: 'Déverrouiller',
        signInWithGoogle: 'Connexion avec Google',
        logout: 'Déconnexion',
        invalidPin: 'Code PIN incorrect',
        role: 'Rôle',
      },
      offline: {
        banner: 'Mode Hors-Ligne — Données synchronisées localement',
        onlineRestored: 'Connexion réseau rétablie',
        syncing: 'Synchronisation Cloud...',
      },
      actions: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        close: 'Fermer',
        search: 'Rechercher...',
        confirm: 'Confirmer',
        downloadInvoice: 'Télécharger Facture',
        startCheckIn: 'Faire Départ',
        startCheckOut: 'Faire Retour',
      }
    }
  },
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        bookings: 'Bookings',
        calendar: 'Calendar',
        fleet: 'Fleet',
        clients: 'Clients',
        maintenance: 'Workshop',
        reports: 'Reports',
        portal: 'Client Portal',
        checkin: 'Check-In',
        checkout: 'Check-Out',
        settings: 'Settings',
        installApp: 'Install App',
      },
      dashboard: {
        title: 'Operational Dashboard',
        quickActions: 'Quick Actions',
        newBooking: 'New Booking',
        scanPlate: 'Scan Plate',
        departuresToday: 'Departures scheduled today',
        returnsToday: 'Returns expected today',
        availableVehicles: 'Available Vehicles',
        fleetStatus: 'Fleet Status',
        occupancyRate: 'Occupancy Rate',
        totalFleet: 'Total Fleet',
      },
      calendar: {
        title: 'Bookings Schedule',
        month: 'Month',
        week: 'Week',
        day: 'Day',
        today: 'Today',
        filterCategory: 'Category',
        allCategories: 'All categories',
        filterStatus: 'Status',
        allStatuses: 'All statuses',
        noBookingsThisDay: 'No bookings on this day',
      },
      status: {
        AVAILABLE: 'Available',
        RENTED: 'Rented',
        MAINTENANCE: 'Maintenance',
        RESERVED: 'Reserved',
        CONFIRMED: 'Confirmed',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
      },
      auth: {
        locked: 'Application Locked',
        enterPin: 'Enter staff PIN code',
        unlock: 'Unlock',
        signInWithGoogle: 'Sign in with Google',
        logout: 'Sign Out',
        invalidPin: 'Incorrect PIN code',
        role: 'Role',
      },
      offline: {
        banner: 'Offline Mode — Local data cache active',
        onlineRestored: 'Network connection restored',
        syncing: 'Syncing to Cloud...',
      },
      actions: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        search: 'Search...',
        confirm: 'Confirm',
        downloadInvoice: 'Download Invoice',
        startCheckIn: 'Check-In',
        startCheckOut: 'Check-Out',
      }
    }
  }
};

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('autofleet_language') || 'fr' : 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
  });

export default i18n;
