'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProviders } from '@/lib/storage';

export interface User {
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'banootik-user';
const CLEANUP_FLAG_V5 = 'banootik-cleanup-v5-final-fix';

const performOneTimeCleanup = () => {
    if (typeof window !== 'undefined') {
        if (!localStorage.getItem(CLEANUP_FLAG_V5)) {
            console.log("Performing one-time cleanup v5...");
            // Remove old, potentially corrupted keys
            localStorage.removeItem('honarbanoo-providers');
            localStorage.removeItem('honarbanoo-user');
            localStorage.removeItem('banootik-users'); // Remove the flawed user list
            localStorage.removeItem(USER_STORAGE_KEY); // Log out any logged-in user to force a fresh login
            
            localStorage.setItem(CLEANUP_FLAG_V5, 'true');
            console.log("Cleanup v5 complete.");
        }
    }
};
performOneTimeCleanup();


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  const syncLoginState = useCallback(() => {
    setIsAuthLoading(true);
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);
  
  useEffect(() => {
    syncLoginState();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        syncLoginState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', syncLoginState);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', syncLoginState);
    };
  }, [syncLoginState]);

  const login = (userData: User) => {
    try {
        const allProviders = getProviders();
        const isProvider = allProviders.some(p => p.phone === userData.phone);
        const accountType = isProvider ? 'provider' : 'customer';

        const userToSave: User = { 
            name: userData.name,
            phone: userData.phone,
            accountType: accountType,
        };
      
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToSave));
      setUser(userToSave);
      
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };
  
  const logout = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      
      // Navigate to home for a clean user experience.
      if (window.location.pathname !== '/') {
        router.push('/');
      } else {
        // If already on the home page, force a reload to ensure all state is reset.
        window.location.reload();
      }

    } catch (error) {
       console.error("Failed to process logout", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, isAuthLoading }}>
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
