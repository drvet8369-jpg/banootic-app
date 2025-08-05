'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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
  logout: (options?: { isCleanup?: boolean }) => void;
  updateUser: (updatedData: Partial<User>) => void;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'banootik-user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  const loadUserFromStorage = () => {
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
  };

  useEffect(() => {
    // 1. Initial Load: Load user on component mount
    loadUserFromStorage();

    // 2. Cross-Tab Sync: Listen for changes in other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        setIsAuthLoading(true);
        loadUserFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (userData: User) => {
    try {
      const userToSave: User = { 
          name: userData.name,
          phone: userData.phone,
          accountType: userData.accountType || 'customer' 
      };
      
      setUser(userToSave);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToSave));
      
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };
  
  const updateUser = (updatedData: Partial<User>) => {
      if (!user) return;

      const newUser = { ...user, ...updatedData };
      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

      const allUsers = getAllUsers();
      const userIndex = allUsers.findIndex(u => u.phone === user.phone);
      if (userIndex > -1) {
          allUsers[userIndex] = { ...allUsers[userIndex], ...updatedData };
          saveAllUsers(allUsers);
      }
  }

  const logout = (options: { isCleanup?: boolean } = {}) => {
    const { isCleanup = false } = options;
    try {
      // Special cleanup logic for the test user "سالن هپکو"
      if (isCleanup && user?.name === 'سالن هپکو') {
        const allUsers = getAllUsers();
        const updatedUsers = allUsers.filter(u => u.phone !== user.phone);
        saveAllUsers(updatedUsers);

        const allProviders = getProviders();
        const updatedProviders = allProviders.filter(p => p.phone !== user.phone);
        saveProviders(updatedProviders);
        
        console.log(`Cleanup complete for user: ${user.name}`);
      }

      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      router.push('/');
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
