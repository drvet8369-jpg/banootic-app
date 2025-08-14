'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { getProviders } from '@/lib/data'; // Import only what's needed for initialization
import type { Provider } from '@/lib/types';


interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  providers: Provider[]; // Keep providers list here to be globally accessible after load
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // 1. Load User from localStorage
        const storedUser = localStorage.getItem('honarbanoo-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        // 2. Load all providers. This is public data now.
        const providersData = await getProviders();
        setProviders(providersData);

      } catch (error) {
        console.error("Failed to parse user from localStorage on initial load", error);
        localStorage.removeItem('honarbanoo-user');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const login = useCallback((userData: User) => {
    try {
      localStorage.setItem('honarbanoo-user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('honarbanoo-user');
      setUser(null);
      // For better UX, redirect to home on logout.
      router.push('/');
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, isLoading, providers }}>
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
