'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Provider, Agreement } from '@/lib/types';
import { getProviders, getAgreementsForUser, updateAgreementStatusAction } from '@/lib/actions';

// This context will now ONLY handle user authentication state.
// It will also fetch global data like providers and agreements upon login.
export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  providers: Provider[];
  agreements: Agreement[];
  updateAgreementStatus: (agreementId: string, status: 'confirmed') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchGlobalData = async (currentUser: User | null) => {
    setIsLoading(true);
    try {
      const providersData = await getProviders();
      setProviders(providersData);

      if (currentUser) {
        const agreementsData = await getAgreementsForUser(currentUser.phone);
        setAgreements(agreementsData);
      } else {
        setAgreements([]);
      }
    } catch (error) {
      console.error("Failed to fetch global data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // On initial load, try to hydrate the user from localStorage.
  useEffect(() => {
    let currentUser: User | null = null;
    try {
      const storedUserJSON = localStorage.getItem('banootik-user');
      if (storedUserJSON) {
        currentUser = JSON.parse(storedUserJSON);
        setUser(currentUser);
      }
    } catch (e) {
      console.error("Could not parse user from localStorage", e);
      localStorage.removeItem('banootik-user');
    }
    fetchGlobalData(currentUser);
  }, []);

  const login = (userData: User) => {
    try {
      localStorage.setItem('banootik-user', JSON.stringify(userData));
      setUser(userData);
      fetchGlobalData(userData); // Fetch data after user logs in
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('banootik-user');
      setUser(null);
      setAgreements([]); // Clear agreements on logout
      router.push('/');
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
  };
  
  const updateAgreementStatus = async (agreementId: string, status: 'confirmed') => {
      await updateAgreementStatusAction(agreementId, status);
      // Re-fetch agreements to update the state
      if(user) {
          const agreementsData = await getAgreementsForUser(user.phone);
          setAgreements(agreementsData);
      }
  }

  return (
    <AuthContext.Provider value={{ 
        isLoggedIn: !!user, 
        user, 
        login, 
        logout, 
        isLoading,
        providers,
        agreements,
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
