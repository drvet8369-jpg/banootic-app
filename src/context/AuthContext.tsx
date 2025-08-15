'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Agreement, Provider } from '@/lib/types';
import { getAgreements, saveAgreements, getProviders } from '@/lib/data';


export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  agreements: Agreement[];
  providers: Provider[];
  addAgreement: (providerPhone: string) => void;
  updateAgreementStatus: (agreementId: string, status: 'confirmed') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const router = useRouter();

  const fetchAppData = useCallback(() => {
    try {
      const storedUser = localStorage.getItem('honarbanoo-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedAgreements = getAgreements();
      setAgreements(storedAgreements);
      const allProviders = getProviders();
      setProviders(allProviders);
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      localStorage.removeItem('honarbanoo-user');
      localStorage.removeItem('honarbanoo-agreements');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppData();
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', fetchAppData);
    return () => {
      window.removeEventListener('storage', fetchAppData);
    };
  }, [fetchAppData]);


  const login = (userData: User) => {
    try {
      localStorage.setItem('honarbanoo-user', JSON.stringify(userData));
      setUser(userData);
      fetchAppData(); // Re-fetch all data on login
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('honarbanoo-user');
      setUser(null);
      router.push('/');
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
    }
  };

  const addAgreement = (providerPhone: string) => {
    if (!user || user.accountType !== 'customer') return;
    
    const existingAgreement = agreements.find(a => a.providerPhone === providerPhone && a.customerPhone === user.phone);
    if(existingAgreement) return; // Don't add duplicates

    const newAgreement: Agreement = {
      id: `${Date.now()}-${user.phone}`,
      providerPhone,
      customerPhone: user.phone,
      customerName: user.name,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    const updatedAgreements = [...agreements, newAgreement];
    saveAgreements(updatedAgreements);
    setAgreements(updatedAgreements);
  };
  
  const updateAgreementStatus = (agreementId: string, status: 'confirmed') => {
    const updatedAgreements = agreements.map(a => 
      a.id === agreementId ? { ...a, status, confirmedAt: new Date().toISOString() } : a
    );
    saveAgreements(updatedAgreements);
    setAgreements(updatedAgreements);
  };


  return (
    <AuthContext.Provider value={{ 
        isLoggedIn: !!user, 
        user, 
        login, 
        logout, 
        isLoading, 
        agreements, 
        providers,
        addAgreement, 
        updateAgreementStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
