import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Agency } from '../types';
import { MOCK_AGENCIES } from '../data/mockData';
import { setFirestoreDoc, subscribeToCollection } from '../lib/firebase';

interface AgencyContextType {
  currentAgency: Agency;
  agencies: Agency[];
  setCurrentAgency: (agency: Agency) => void;
  updateAgency: (agency: Agency) => void;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);
const LOCAL_STORAGE_PREFIX = 'autofleet_pro_';

export const AgencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agencies, setAgencies] = useState<Agency[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'agencies');
    return saved ? JSON.parse(saved) : MOCK_AGENCIES;
  });

  const [currentAgency, setCurrentAgency] = useState<Agency>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'current_agency');
    return saved ? JSON.parse(saved) : agencies[0] || MOCK_AGENCIES[0];
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Agency>('agencies', (items) => {
      if (items && items.length > 0) {
        setAgencies(items);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'agencies', JSON.stringify(items));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'agencies', JSON.stringify(agencies));
  }, [agencies]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'current_agency', JSON.stringify(currentAgency));
  }, [currentAgency]);

  const updateAgency = useCallback((agency: Agency) => {
    setAgencies((prev) => prev.map((a) => (a.id === agency.id ? agency : a)));
    if (currentAgency.id === agency.id) {
      setCurrentAgency(agency);
    }
    setFirestoreDoc('agencies', agency.id, agency).catch(() => {});
  }, [currentAgency.id]);

  return (
    <AgencyContext.Provider
      value={{
        currentAgency,
        agencies,
        setCurrentAgency,
        updateAgency,
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgencies = (): AgencyContextType => {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error('useAgencies must be used within an AgencyProvider');
  }
  return context;
};
