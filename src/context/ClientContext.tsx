import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Client } from '../types';
import { MOCK_CLIENTS } from '../data/mockData';
import { setFirestoreDoc, subscribeToCollection } from '../lib/firebase';
import { useToast } from './ToastContext';

interface ClientContextType {
  clients: Client[];
  addClient: (clientData: Omit<Client, 'id' | 'totalBookings' | 'documents' | 'createdAt'>) => Client;
  updateClient: (clientId: string, clientData: Partial<Client>) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);
const LOCAL_STORAGE_PREFIX = 'autofleet_pro_';

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'clients');
    return saved ? JSON.parse(saved) : MOCK_CLIENTS;
  });

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Client>('clients', (items) => {
      if (items && items.length > 0) {
        setClients(items);
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'clients', JSON.stringify(items));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'clients', JSON.stringify(clients));
  }, [clients]);

  const addClient = useCallback(
    (clientData: Omit<Client, 'id' | 'totalBookings' | 'documents' | 'createdAt'>): Client => {
      const newClient: Client = {
        ...clientData,
        id: `c-${Date.now()}`,
        totalBookings: 0,
        documents: [],
        createdAt: new Date().toISOString(),
      };
      setClients((prev) => [newClient, ...prev]);
      setFirestoreDoc('clients', newClient.id, newClient).catch((err) => {
        toast.error('Erreur lors de la sauvegarde du client sur le Cloud');
      });
      toast.success(`Client ${newClient.firstName} ${newClient.lastName} créé avec succès`);
      return newClient;
    },
    [toast]
  );

  const updateClient = useCallback(
    (clientId: string, clientData: Partial<Client>) => {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, ...clientData } : c))
      );
      setFirestoreDoc('clients', clientId, clientData).catch(() => {});
    },
    []
  );

  return (
    <ClientContext.Provider
      value={{
        clients,
        addClient,
        updateClient,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};
