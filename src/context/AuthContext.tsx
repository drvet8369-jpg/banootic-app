'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { User } from '@/lib/types';

// This is a placeholder context. The functionality will be rebuilt.

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  
  const value: AuthContextType = {
    isLoggedIn: false,
    user: null,
    login: () => console.log("Login function is not implemented."),
    logout: () => console.log("Logout function is not implemented."),
  };

  return (
    <AuthContext.Provider value={value}>
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
