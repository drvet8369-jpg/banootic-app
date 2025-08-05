'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllUsers, saveAllUsers } from '@/lib/storage';

export interface User {
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAuthLoading: boolean; // New state to track initial loading
  user: User | null;
  login: (userData: User) => void;
  logout: (options?: { isCleanup?: boolean }) => void;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'banootik-user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Start with loading true
  const router = useRouter();

  // On initial component mount, try to hydrate the user from localStorage.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage on initial load", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setIsAuthLoading(false); // Finished loading
    }
  }, []);

  // This effect handles synchronization between tabs
  useEffect(() => {
    const syncState = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        if (event.newValue) {
          try {
            const newUser = JSON.parse(event.newValue);
            setUser(newUser);
          } catch {
             setUser(null);
          }
        } else {
          setUser(null);
          router.push('/'); 
        }
      }
    };

    window.addEventListener('storage', syncState);
    return () => {
      window.removeEventListener('storage', syncState);
    };
  }, [router]);


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

      // Also update the master user list
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
      if (isCleanup && user?.name === 'سالن مد وحید') {
        const allUsers = getAllUsers();
        const updatedUsers = allUsers.filter(u => u.phone !== user.phone);
        saveAllUsers(updatedUsers);
      }
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      router.push('/');
    } catch (error) {
       console.error("Failed to process logout", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, isAuthLoading, user, login, logout, updateUser }}>
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
