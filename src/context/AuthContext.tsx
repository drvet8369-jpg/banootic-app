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
    // This is a utility function specifically for the 'سالن مد وحید' test case
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
    }
  }, []);

  // This effect handles synchronization between tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        if (event.newValue) {
          // A user was logged in or updated in another tab
          try {
            setUser(JSON.parse(event.newValue));
          } catch {
             setUser(null);
          }
        } else {
          // The user was logged out in another tab
          setUser(null);
          router.push('/'); // Redirect to home on logout from other tab
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
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
          allUsers[userIndex] = newUser;
          saveAllUsers(allUsers);
      }
  }


  const logout = () => {
    try {
      const currentUser = user;
      
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);

      // Special logic to completely wipe the test user as requested
      // This will allow re-registering with the same phone number for testing
      if (currentUser && currentUser.name === 'سالن مد وحید') {
        deleteUserPermanently(currentUser.phone);
        console.log(`User 'سالن مد وحید' with phone ${currentUser.phone} has been permanently deleted from all records.`);
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