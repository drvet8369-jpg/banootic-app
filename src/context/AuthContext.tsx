'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllUsers, saveAllUsers, getProviders, saveProviders } from '@/lib/storage';

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
  updateUser: (updatedData: Partial<User>) => void;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'banootik-user';
// We use a new, more specific cleanup flag to ensure the correct data is reset.
const CLEANUP_FLAG_V2 = 'banootik-cleanup-v2-provider-fix';

// A one-time check to see if we need to clean up localStorage from previous bad states.
const performOneTimeCleanup = () => {
    if (typeof window !== 'undefined') {
        if (!localStorage.getItem(CLEANUP_FLAG_V2)) {
            console.log("Performing one-time cleanup to restore provider list...");
            // This key is where the provider data is stored. Removing it will force
            // the app to repopulate it with the correct default data on next load.
            localStorage.removeItem('banootik-providers'); 
            localStorage.setItem(CLEANUP_FLAG_V2, 'true');
            console.log("Cleanup complete. Provider list will be restored.");
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

    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
  
  const updateUser = (updatedData: Partial<User>) => {
      if (!user) return;

      const newUser = { ...user, ...updatedData };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);

      const allUsers = getAllUsers();
      const userIndex = allUsers.findIndex(u => u.phone === user.phone);
      if (userIndex > -1) {
          allUsers[userIndex] = { ...allUsers[userIndex], ...updatedData };
          saveAllUsers(allUsers);
      }
  }

  const logout = () => {
    try {
      // The logout function should ONLY handle logging out the current user.
      // It should never modify the application's core data like the provider list.
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
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, updateUser, isAuthLoading }}>
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
