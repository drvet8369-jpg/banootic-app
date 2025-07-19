'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // On component mount, check if user data exists in localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('honarbanoo-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      // Clear potentially corrupted storage
      localStorage.removeItem('honarbanoo-user');
    }
  }, []);

  const login = (userData: User) => {
    try {
      localStorage.setItem('honarbanoo-user', JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('honarbanoo-user');
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
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
