import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { TopNavBar } from './components/navigation/TopNavBar';
import { BottomNav } from './components/navigation/BottomNav';
import { QuickActionFAB } from './components/navigation/QuickActionFAB';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { PlateScannerModal } from './components/modals/PlateScannerModal';
import { BookingWizardModal } from './components/bookings/BookingWizardModal';
import { BookingFormModal } from './components/forms/BookingFormModal';
import { NewClientModal } from './components/clients/NewClientModal';
import { MobileSplashScreen } from './components/MobileSplashScreen';
import { Loader2 } from 'lucide-react';

// Code splitting des vues avec React.lazy
const DashboardView = lazy(() =>
  import('./components/dashboard/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const BookingsView = lazy(() =>
  import('./components/bookings/BookingsView').then((m) => ({ default: m.BookingsView }))
);
const BookingCalendarView = lazy(() =>
  import('./components/calendar/BookingCalendarView').then((m) => ({ default: m.BookingCalendarView }))
);
const FleetView = lazy(() =>
  import('./components/fleet/FleetView').then((m) => ({ default: m.FleetView }))
);
const ClientsView = lazy(() =>
  import('./components/clients/ClientsView').then((m) => ({ default: m.ClientsView }))
);
const MaintenanceView = lazy(() =>
  import('./components/maintenance/MaintenanceView').then((m) => ({ default: m.MaintenanceView }))
);
const ReportsView = lazy(() =>
  import('./components/reports/ReportsView').then((m) => ({ default: m.ReportsView }))
);
const ClientPortalView = lazy(() =>
  import('./components/portal/ClientPortalView').then((m) => ({ default: m.ClientPortalView }))
);
const CheckInFlow = lazy(() =>
  import('./components/checkin/CheckInFlow').then((m) => ({ default: m.CheckInFlow }))
);
const CheckOutFlow = lazy(() =>
  import('./components/checkout/CheckOutFlow').then((m) => ({ default: m.CheckOutFlow }))
);

const ViewLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center" role="status" aria-live="polite">
    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
    <span className="text-xs font-mono text-slate-400">Chargement de la vue...</span>
  </div>
);

// Check-In Deep Link Wrapper
const CheckInRouteWrapper: React.FC<{
  onSuccess: (bookingId: string) => void;
}> = ({ onSuccess }) => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const { bookings, selectedBookingForCheckIn, setSelectedBookingForCheckIn } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (bookingId) {
      const b = bookings.find((item) => item.id === bookingId || item.bookingNumber === bookingId);
      if (b && selectedBookingForCheckIn?.id !== b.id) {
        setSelectedBookingForCheckIn(b);
      }
    }
  }, [bookingId, bookings, selectedBookingForCheckIn, setSelectedBookingForCheckIn]);

  return (
    <CheckInFlow
      onCancel={() => {
        setSelectedBookingForCheckIn(null);
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/bookings');
        }
      }}
      onSuccess={onSuccess}
    />
  );
};

// Check-Out Deep Link Wrapper
const CheckOutRouteWrapper: React.FC<{
  onSuccess: (bookingId: string) => void;
}> = ({ onSuccess }) => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const { bookings, selectedBookingForCheckOut, setSelectedBookingForCheckOut } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (bookingId) {
      const b = bookings.find((item) => item.id === bookingId || item.bookingNumber === bookingId);
      if (b && selectedBookingForCheckOut?.id !== b.id) {
        setSelectedBookingForCheckOut(b);
      }
    }
  }, [bookingId, bookings, selectedBookingForCheckOut, setSelectedBookingForCheckOut]);

  return (
    <CheckOutFlow
      onCancel={() => {
        setSelectedBookingForCheckOut(null);
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/bookings');
        }
      }}
      onSuccess={onSuccess}
    />
  );
};

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLocked } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Modals state
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [showZodBookingForm, setShowZodBookingForm] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [wizardPreSelectedVehicleId, setWizardPreSelectedVehicleId] = useState<string | undefined>();
  const [wizardPreSelectedStartDate, setWizardPreSelectedStartDate] = useState<string | undefined>();
  const [wizardPreSelectedClientId, setWizardPreSelectedClientId] = useState<string | undefined>();
  const [showPlateScanner, setShowPlateScanner] = useState(false);
  const [activeInvoiceBookingId, setActiveInvoiceBookingId] = useState<string | null>(null);

  // Mobile Animated Splash Screen state (session-based)
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasSeenSplash = sessionStorage.getItem('qf_splash_shown');
    return !hasSeenSplash;
  });

  // Sync activeTab with current URL route
  useEffect(() => {
    const path = location.pathname.replace(/^\//, '').split('/')[0];
    const validTabs = [
      'dashboard',
      'bookings',
      'calendar',
      'fleet',
      'clients',
      'maintenance',
      'reports',
      'portal',
      'checkin',
      'checkout',
    ];

    if (validTabs.includes(path)) {
      const targetTab = path === 'portal' ? 'client_portal' : (path as any);
      if (activeTab !== targetTab) {
        setActiveTab(targetTab);
      }
    } else if (location.pathname === '/' && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  }, [location.pathname, activeTab, setActiveTab]);

  // When activeTab changes programmatically (e.g. from bottom nav or context), navigate to route
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'client_portal') {
      navigate('/portal');
    } else {
      navigate(`/${tab}`);
    }
  };

  const handleOpenBookingWizardWithVehicle = (
    vehicleId?: string,
    startDate?: string,
    clientId?: string
  ) => {
    setWizardPreSelectedVehicleId(vehicleId);
    setWizardPreSelectedStartDate(startDate);
    setWizardPreSelectedClientId(clientId);
    setShowZodBookingForm(true);
  };

  const handleOpenInvoice = (bookingId: string) => {
    setActiveInvoiceBookingId(bookingId);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background App container: blurred and inert when locked */}
      <div
        className={`flex flex-col flex-1 ${
          isLocked ? 'pointer-events-none select-none filter blur-sm transition-all duration-300' : ''
        }`}
        aria-hidden={isLocked}
      >
        {/* Top Navigation Bar */}
        <TopNavBar />

        {/* Main Routed Content with Code Splitting Suspense */}
        <main className="flex-1 w-full pb-20 md:pb-16" id="main-content" tabIndex={-1}>
          <Suspense fallback={<ViewLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <DashboardView
                    onOpenBookingWizard={handleOpenBookingWizardWithVehicle}
                    onOpenPlateScanner={() => setShowPlateScanner(true)}
                  />
                }
              />
              <Route
                path="/bookings"
                element={
                  <BookingsView
                    onOpenBookingWizard={() => handleOpenBookingWizardWithVehicle()}
                    onOpenInvoice={handleOpenInvoice}
                  />
                }
              />
              <Route
                path="/calendar"
                element={
                  <BookingCalendarView
                    onOpenBookingWizard={handleOpenBookingWizardWithVehicle}
                    onOpenInvoice={handleOpenInvoice}
                  />
                }
              />
              <Route
                path="/fleet"
                element={
                  <FleetView
                    onStartBooking={handleOpenBookingWizardWithVehicle}
                  />
                }
              />
              <Route
                path="/clients"
                element={
                  <ClientsView
                    onOpenNewClientModal={() => setShowNewClientModal(true)}
                    onStartBookingWithClient={(clientId) =>
                      handleOpenBookingWizardWithVehicle(undefined, undefined, clientId)
                    }
                  />
                }
              />
              <Route path="/maintenance" element={<MaintenanceView />} />
              <Route path="/reports" element={<ReportsView />} />
              <Route path="/portal" element={<ClientPortalView />} />
              <Route
                path="/checkin"
                element={
                  <CheckInRouteWrapper
                    onSuccess={(bookingId) => {
                      setActiveInvoiceBookingId(bookingId);
                      navigate('/dashboard');
                    }}
                  />
                }
              />
              <Route
                path="/checkin/:bookingId"
                element={
                  <CheckInRouteWrapper
                    onSuccess={(bookingId) => {
                      setActiveInvoiceBookingId(bookingId);
                      navigate('/dashboard');
                    }}
                  />
                }
              />
              <Route
                path="/checkout"
                element={
                  <CheckOutRouteWrapper
                    onSuccess={(bookingId) => {
                      setActiveInvoiceBookingId(bookingId);
                      navigate('/dashboard');
                    }}
                  />
                }
              />
              <Route
                path="/checkout/:bookingId"
                element={
                  <CheckOutRouteWrapper
                    onSuccess={(bookingId) => {
                      setActiveInvoiceBookingId(bookingId);
                      navigate('/dashboard');
                    }}
                  />
                }
              />
              {/* Fallback wildcard route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* Floating Action Button for Rapid Tactile Access */}
        <QuickActionFAB
          onOpenBookingWizard={() => handleOpenBookingWizardWithVehicle()}
          onOpenNewClient={() => setShowNewClientModal(true)}
          onOpenPlateScanner={() => setShowPlateScanner(true)}
        />

        {/* Mobile Fixed Bottom Navigation Bar */}
        <BottomNav />

        {/* Offline Status Badge */}
        <OfflineIndicator />
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

      {/* Zod + React Hook Form Booking Modal */}
      {showZodBookingForm && (
        <BookingFormModal
          isOpen={showZodBookingForm}
          onClose={() => {
            setShowZodBookingForm(false);
            setWizardPreSelectedVehicleId(undefined);
            setWizardPreSelectedStartDate(undefined);
            setWizardPreSelectedClientId(undefined);
          }}
          preselectedVehicleId={wizardPreSelectedVehicleId}
          preselectedStartDate={wizardPreSelectedStartDate}
          preselectedClientId={wizardPreSelectedClientId}
        />
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewClientModal
          isOpen={showNewClientModal}
          onClose={() => setShowNewClientModal(false)}
          onSuccess={() => {
            setShowNewClientModal(false);
          }}
        />
      )}

      {/* Legacy Booking Wizard Modal backup */}
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
          onVehicleSelected={() => {
            navigate('/fleet');
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

      {/* Mobile Animated Splash Screen */}
      {showSplashScreen && (
        <MobileSplashScreen
          minDurationMs={2400}
          onFinish={() => {
            sessionStorage.setItem('qf_splash_shown', 'true');
            setShowSplashScreen(false);
          }}
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
