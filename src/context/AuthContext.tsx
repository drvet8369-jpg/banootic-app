
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// The user object shape used within the React application.
// This interface uses camelCase for consistency in client-side code.
export interface AppUser {
  id: string; // This is the user_id from the DB (UUID)
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: AppUser | null;
  isLoading: boolean;
  login: (userData: AppUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the storage key as a constant to prevent typos
const LOCAL_STORAGE_KEY = 'banotik-user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On initial load, try to hydrate the user from localStorage.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage on initial load", error);
      // Clean up potentially corrupted data
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const login = (userData: AppUser) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setUser(null);
      // Using window.location.href forces a full page reload, clearing all states
      // and ensuring a clean logout experience across the app.
      window.location.href = '/'; 
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
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
