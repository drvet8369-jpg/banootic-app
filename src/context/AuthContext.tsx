'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  name: string;
  // The user's phone number is their unique ID
  phone: string; 
  accountType: 'customer' | 'provider';
  // Optional fields for new provider registration context
  serviceType?: string;
  bio?: string;
  service?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'banotic-user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On initial load, try to hydrate the user from localStorage.
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage on initial load", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    setIsLoading(true);
    try {
      const userToSave = { ...userData, accountType: userData.accountType || 'customer' };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToSave));
      setUser(userToSave);
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsLoading(true);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      router.push('/');
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
       setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, isLoading, login, logout }}>
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
