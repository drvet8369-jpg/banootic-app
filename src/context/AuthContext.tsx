'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  phone: string;
  accountType?: 'customer' | 'provider';
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // This effect runs once on mount to check for a logged-in user.
    try {
      const storedUser = localStorage.getItem('honarbanoo-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      // Ensure a clean state if localStorage is corrupted
      localStorage.removeItem('honarbanoo-user');
      setUser(null);
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
      // Redirect to home page for a better user experience
      router.push('/');
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout }}>
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
