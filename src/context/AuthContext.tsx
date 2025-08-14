'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';

// The AuthContext will now ONLY handle authentication state (user, isLoggedIn, isLoading).
// All other data (providers, reviews, etc.) will be fetched by the components that need them.
// This is a much cleaner and more robust architecture.

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // isLoading now only refers to auth state
  const router = useRouter();

  useEffect(() => {
    // This effect runs once on app load to check for a logged-in user in localStorage.
    const loadUserFromStorage = () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('honarbanoo-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('honarbanoo-user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
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
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, isLoading }}>
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
