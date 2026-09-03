import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const useAuth = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    isLocked,
    setIsLocked,
    lockApp,
    unlockWithPin,
  } = useApp();

  const switchRole = (role: UserRole) => {
    const matchingUser = users.find(u => u.role === role) || {
      id: `u-${role.toLowerCase()}`,
      name: `Agent (${role})`,
      email: `${role.toLowerCase()}@autofleet.fr`,
      role,
      agencyId: 'agency-paris-orly',
      pinCode: '1111',
    };
    setCurrentUser(matchingUser);
  };

  const isRole = (role: UserRole | UserRole[]) => {
    if (Array.isArray(role)) {
      return role.includes(currentUser.role);
    }
    return currentUser.role === role;
  };

  const isAdmin = currentUser.role === 'ADMIN';
  const isAgentComptoir = currentUser.role === 'AGENT_COMPTOIR';
  const isAgentTechnique = currentUser.role === 'AGENT_TECHNIQUE';

  // Specific Role Permissions:
  // Admin: full access + add/manage users
  // Agent Comptoir: reservations, checkin, checkout, car status, clients
  // Agent Technique: cars, maintenance status, servicing/vidanges/plaquettes
  const canManageUsers = isAdmin;
  const canManageBookings = isAdmin || isAgentComptoir;
  const canCheckInOut = isAdmin || isAgentComptoir;
  const canManageClients = isAdmin || isAgentComptoir;
  const canManageVehicles = true;
  const canChangeVehicleStatus = true;
  const canSetMaintenance = isAdmin || isAgentTechnique;
  const canPerformMaintenanceServicing = isAdmin || isAgentTechnique;
  const canViewReports = isAdmin;

  // Compatibility flags
  const isManagerOrAdmin = isAdmin;
  const isAgent = true;
  const isClient = false;

  return {
    currentUser,
    setCurrentUser,
    users,
    switchRole,
    isRole,
    isAdmin,
    isAgentComptoir,
    isAgentTechnique,
    canManageUsers,
    canManageBookings,
    canCreateBooking: canManageBookings,
    canCheckInOut,
    canPerformCheckInOut: canCheckInOut,
    canManageClients,
    canManageVehicles,
    canChangeVehicleStatus,
    canSetMaintenance,
    canPerformMaintenanceServicing,
    canViewReports,
    isManagerOrAdmin,
    isAgent,
    isClient,
    isLocked,
    setIsLocked,
    lockApp,
    unlockWithPin,
  };
};
