import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopNavBar } from './components/navigation/TopNavBar';
import { BottomNav } from './components/navigation/BottomNav';
import { QuickActionFAB } from './components/navigation/QuickActionFAB';
import { DashboardView } from './components/dashboard/DashboardView';
import { BookingsView } from './components/bookings/BookingsView';
import { BookingWizardModal } from './components/bookings/BookingWizardModal';
import { FleetView } from './components/fleet/FleetView';
import { ClientsView } from './components/clients/ClientsView';
import { ReportsView } from './components/reports/ReportsView';
import { ClientPortalView } from './components/portal/ClientPortalView';
import { CheckInFlow } from './components/checkin/CheckInFlow';
import { CheckOutFlow } from './components/checkout/CheckOutFlow';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { PlateScannerModal } from './components/modals/PlateScannerModal';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { MaintenanceView } from './components/maintenance/MaintenanceView';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLocked } = useApp();

  // Modal triggers
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [wizardPreSelectedVehicleId, setWizardPreSelectedVehicleId] = useState<string | undefined>();
  const [showPlateScanner, setShowPlateScanner] = useState(false);
  const [activeInvoiceBookingId, setActiveInvoiceBookingId] = useState<string | null>(null);

  const handleOpenBookingWizardWithVehicle = (vehicleId: string) => {
    setWizardPreSelectedVehicleId(vehicleId);
    setShowBookingWizard(true);
  };

  const handleOpenInvoice = (bookingId: string) => {
    setActiveInvoiceBookingId(bookingId);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background App container: made inert & blurred when locked */}
      <div
        className={`flex flex-col flex-1 ${
          isLocked ? 'pointer-events-none select-none filter blur-sm transition-all duration-300' : ''
        }`}
        aria-hidden={isLocked}
      >
        {/* Top Navigation Bar with Role switch, Offline indicator & Alerts */}
        <TopNavBar />

        {/* Main App Content View Switcher */}
        <main className="flex-1 w-full pb-20 md:pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenBookingWizard={(vehicleId?: string) => {
                setWizardPreSelectedVehicleId(vehicleId);
                setShowBookingWizard(true);
              }}
              onOpenPlateScanner={() => setShowPlateScanner(true)}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView
              onOpenBookingWizard={() => {
                setWizardPreSelectedVehicleId(undefined);
                setShowBookingWizard(true);
              }}
              onOpenInvoice={handleOpenInvoice}
            />
          )}

          {activeTab === 'fleet' && (
            <FleetView
              onStartBooking={handleOpenBookingWizardWithVehicle}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              onOpenNewClientModal={() => {
                setShowBookingWizard(true);
              }}
              onStartBookingWithClient={(clientId) => {
                setShowBookingWizard(true);
              }}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'client_portal' && <ClientPortalView />}

          {activeTab === 'checkin' && (
            <CheckInFlow
              onCancel={() => setActiveTab('dashboard')}
              onSuccess={(bookingId) => {
                setActiveInvoiceBookingId(bookingId);
                setActiveTab('dashboard');
              }}
            />
          )}

          {activeTab === 'checkout' && (
            <CheckOutFlow
              onCancel={() => setActiveTab('dashboard')}
              onSuccess={(bookingId) => {
                setActiveInvoiceBookingId(bookingId);
                setActiveTab('dashboard');
              }}
            />
          )}
        </main>

        {/* Floating Action Button for Rapid Tactile Access */}
        <QuickActionFAB
          onOpenBookingWizard={() => {
            setWizardPreSelectedVehicleId(undefined);
            setShowBookingWizard(true);
          }}
          onOpenNewClient={() => {
            setShowBookingWizard(true);
          }}
          onOpenPlateScanner={() => setShowPlateScanner(true)}
        />

        {/* Mobile Fixed Bottom Navigation Bar */}
        <BottomNav />
      </div>

      {/* Mandatory Authentication Popup on Launch or when Screen is Locked */}
      {isLocked && (
        <PinLockScreen
          isModal={true}
          mandatory={true}
          title="Authentification Requise"
          subtitle="Identifiez-vous pour déverrouiller et utiliser l'application"
        />
      )}

      {/* Booking Wizard 3-step Modal */}
      {showBookingWizard && (
        <BookingWizardModal
          preSelectedVehicleId={wizardPreSelectedVehicleId}
          onClose={() => {
            setShowBookingWizard(false);
            setWizardPreSelectedVehicleId(undefined);
          }}
        />
      )}

      {/* Plate Scanner Viewfinder Modal */}
      {showPlateScanner && (
        <PlateScannerModal
          onClose={() => setShowPlateScanner(false)}
          onVehicleSelected={(vId) => {
            setActiveTab('fleet');
          }}
        />
      )}

      {/* Invoice & Rental Contract Modal */}
      {activeInvoiceBookingId && (
        <InvoiceModal
          bookingId={activeInvoiceBookingId}
          onClose={() => setActiveInvoiceBookingId(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
