
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
  login: (userData: User) => void;
  logout: () => void;
  switchAccountType: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A one-time check to see if we need to clean up localStorage
const performCleanup = () => {
    if (typeof window !== 'undefined') {
        const cleanupFlag = 'honarbanoo-cleanup-v13-reset-portfolio'; // Use a new flag to re-run if needed
        if (!localStorage.getItem(cleanupFlag)) {
            console.log("Performing one-time cleanup of localStorage for portfolio reset...");
            localStorage.removeItem('honarbanoo-providers'); // This will force a reset to default data
            localStorage.setItem(cleanupFlag, 'true');
        }
    }
};

if (typeof window !== 'undefined') {
    performCleanup();
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // On initial load, try to hydrate the user from localStorage.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('honarbanoo-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage on initial load", error);
      // Clean up corrupted data
      localStorage.removeItem('honarbanoo-user');
    }
  }, []);

  const login = (userData: User) => {
    try {
      // Ensure accountType is always set
      const userToSave = { ...userData, accountType: userData.accountType || 'customer' };
      localStorage.setItem('honarbanoo-user', JSON.stringify(userToSave));
      setUser(userToSave);
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
  
  const switchAccountType = () => {
    if (!user) return;
    
    // This functionality is now primarily for development/testing convenience.
    // In a real app, a user wouldn't just "switch" roles this easily.
    const newAccountType = user.accountType === 'provider' ? 'customer' : 'provider';
    const updatedUser = { ...user, accountType: newAccountType };

    try {
      localStorage.setItem('honarbanoo-user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      // Navigate to a neutral page to reflect UI changes
      router.push('/');
    } catch (error) {
       console.error("Failed to save updated user to localStorage", error);
    }
  };


  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, switchAccountType }}>
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
