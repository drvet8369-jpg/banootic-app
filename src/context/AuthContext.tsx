'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

const USER_STORAGE_KEY = 'honarbanoo-user';
// A new, final cleanup flag to ensure the correct data structures are used.
const CLEANUP_FLAG_V4 = 'honarbanoo-cleanup-v4-final';

// A one-time check to see if we need to clean up localStorage from previous bad states.
const performOneTimeCleanup = () => {
    if (typeof window !== 'undefined') {
        if (!localStorage.getItem(CLEANUP_FLAG_V4)) {
            console.log("Performing one-time cleanup to restore data integrity...");
            localStorage.removeItem('honarbanoo-providers'); // This key was being corrupted
            localStorage.removeItem(USER_STORAGE_KEY); // Log out any logged-in user
            
            // Remove any other potentially problematic keys from older versions
            localStorage.removeItem('banootik-users');
            localStorage.removeItem('banootik-providers');
            localStorage.removeItem('banootik-user');


            localStorage.setItem(CLEANUP_FLAG_V4, 'true');
            console.log("Cleanup complete. Data will be restored on next load.");
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
    // Also re-check on focus to catch changes more reliably
    window.addEventListener('focus', syncLoginState);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', syncLoginState);
    };
  }, [syncLoginState]);

  const login = (userData: User) => {
    try {
      const userToSave: User = { 
          name: userData.name,
          phone: userData.phone,
          accountType: userData.accountType || 'customer' 
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
