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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'banootik-user';

const deleteUserPermanently = (phone: string) => {
    const allProviders = getProviders();
    const updatedProviders = allProviders.filter(p => p.phone !== phone);
    saveProviders(updatedProviders);

    const allUsers = getAllUsers();
    const updatedUsers = allUsers.filter(u => u.phone !== phone);
    saveAllUsers(updatedUsers);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // This callback function will reload the user state from localStorage.
  // It's wrapped in useCallback to ensure it has a stable identity.
  const reloadUser = useCallback(() => {
    try {
      const storedUserJSON = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserJSON) {
        const storedUser = JSON.parse(storedUserJSON);
        // We compare with current state to avoid unnecessary re-renders
        if (JSON.stringify(storedUser) !== JSON.stringify(user)) {
           setUser(storedUser);
        }
      } else {
        if (user !== null) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Failed to reload user from localStorage", error);
      setUser(null);
    }
  }, [user]);


  // This useEffect hook sets up the synchronization between tabs.
  useEffect(() => {
    // Load initial data on mount
    reloadUser();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        // When localStorage changes in another tab, reload the state in this tab.
        reloadUser();
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reloadUser]);


  const login = (userData: User) => {
    try {
      const userToSave: User = { 
          name: userData.name,
          phone: userData.phone,
          accountType: userData.accountType || 'customer' 
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToSave));
      setUser(userToSave);
      
      const allUsers = getAllUsers();
      const userIndex = allUsers.findIndex(u => u.phone === userData.phone);
      if (userIndex > -1) {
          allUsers[userIndex] = userToSave;
      } else {
          allUsers.push(userToSave);
      }
      saveAllUsers(allUsers);

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
          allUsers[userIndex] = newUser;
          saveAllUsers(allUsers);
      }
  }


  const logout = () => {
    try {
      const currentUser = user;
      
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);

      // Special logic for the test user as requested
      if (currentUser && currentUser.name === 'سالن مد وحید') {
        deleteUserPermanently(currentUser.phone);
        console.log(`User 'سالن مد وحید' with phone ${currentUser.phone} has been permanently deleted.`);
      }

      router.push('/');
    } catch (error) {
       console.error("Failed to process logout and cleanup", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout, updateUser }}>
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
