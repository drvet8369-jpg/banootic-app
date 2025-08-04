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

  const reloadData = () => {
    try {
      const storedUserJSON = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserJSON) {
        const storedUser: User = JSON.parse(storedUserJSON);
        const allUsers = getAllUsers();
        const userExists = allUsers.some(u => u.phone === storedUser.phone);
        
        if (userExists) {
             setUser(storedUser);
        } else {
             localStorage.removeItem(USER_STORAGE_KEY);
             setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage on reload", error);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    }
  }

  // Effect for initial load and for listening to storage changes from other tabs
  useEffect(() => {
    // Initial load
    reloadData();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        // When storage changes in another tab, reload the data in this tab.
        reloadData();
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

      if (currentUser && currentUser.name === 'سالن مد نهال') {
        deleteUserPermanently(currentUser.phone);
        console.log(`User 'سالن مد نهال' with phone ${currentUser.phone} has been permanently deleted.`);
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
