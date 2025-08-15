'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';

// This context will now ONLY handle user authentication state.
// Data fetching will be moved to the components that need it to avoid race conditions.
export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This effect runs once on mount to hydrate the user state from localStorage.
    setIsLoading(true);
    try {
      const storedUserJSON = localStorage.getItem('honarbanoo-user');
      if (storedUserJSON) {
        setUser(JSON.parse(storedUserJSON));
      }
    } catch (e) {
      console.error("Could not parse user from localStorage", e);
      localStorage.removeItem('honarbanoo-user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    try {
      localStorage.setItem('honarbanoo-user', JSON.stringify(userData));
      setUser(userData);
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

  return (
    <AuthContext.Provider value={{ 
        isLoggedIn: !!user, 
        user, 
        login, 
        logout, 
        isLoading,
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
