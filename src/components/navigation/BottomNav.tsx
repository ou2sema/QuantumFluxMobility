import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Car,
  Users,
  BarChart3,
  Wrench,
  ShieldCheck,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const { isAdmin, isAgentComptoir, isAgentTechnique } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Define tab navigation based on the 3 user groups
  let navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'bookings', label: t('nav.bookings'), icon: CalendarCheck },
    { id: 'calendar', label: t('nav.calendar'), icon: CalendarDays },
    { id: 'fleet', label: t('nav.fleet'), icon: Car },
    { id: 'maintenance', label: t('nav.maintenance'), icon: Wrench },
    { id: 'clients', label: t('nav.clients'), icon: Users },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3 },
  ];

  if (isAgentComptoir) {
    navItems = [
      { id: 'bookings', label: t('nav.bookings'), icon: CalendarCheck },
      { id: 'calendar', label: t('nav.calendar'), icon: CalendarDays },
      { id: 'fleet', label: t('nav.fleet'), icon: Car },
      { id: 'clients', label: t('nav.clients'), icon: Users },
    ];
  } else if (isAgentTechnique) {
    navItems = [
      { id: 'maintenance', label: t('nav.maintenance'), icon: Wrench },
      { id: 'fleet', label: t('nav.fleet'), icon: Car },
      { id: 'calendar', label: t('nav.calendar'), icon: CalendarDays },
    ];
  }

  const handleNavClick = (id: string) => {
    setActiveTab(id as any);
    navigate(`/${id}`);
  };

  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-40 bg-[#0D1224]/95 backdrop-blur-md border-t border-gray-800 pb-safe px-1.5 sm:px-3 py-1.5 sm:py-2 select-none shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {/* Sync status indicator (Geometric balance desktop/tablet feature) */}
        <div className="hidden md:flex items-center gap-3 pl-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-gray-400 font-mono">
              {isAdmin ? 'Mode Administrateur' : isAgentComptoir ? 'Agent Comptoir' : 'Agent Technique'}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">PRO</span>
        </div>

        {/* Tab Buttons Grid / Flex - perfectly fitted for mobile */}
        <div className="grid grid-flow-col auto-cols-fr w-full md:w-auto md:flex md:items-center md:justify-end gap-1 sm:gap-1.5" role="menubar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(item.id)}
                className={`min-h-[48px] sm:min-h-[46px] px-1 sm:px-3 py-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all duration-150 active:scale-95 cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none ${
                  isActive
                    ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60 font-bold'
                }`}
                title={item.label}
              >
                <Icon className={`w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="text-[9px] sm:text-xs uppercase tracking-wider font-mono truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
