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

// This function will permanently delete a user from the providers and users lists.
const deleteUserPermanently = (phone: string) => {
    // Remove from providers list
    const allProviders = getProviders();
    const updatedProviders = allProviders.filter(p => p.phone !== phone);
    saveProviders(updatedProviders);

    // Remove from all users list
    const allUsers = getAllUsers();
    const updatedUsers = allUsers.filter(u => u.phone !== phone);
    saveAllUsers(updatedUsers);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // On initial load, try to hydrate the user from localStorage.
  useEffect(() => {
    try {
      const storedUserJSON = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserJSON) {
        const storedUser: User = JSON.parse(storedUserJSON);
        
        // Data integrity check: on load, ensure the user exists in the master list.
        // If not, it's stale data, so log them out.
        const allUsers = getAllUsers();
        const userExists = allUsers.some(u => u.phone === storedUser.phone);
        
        if (userExists) {
             setUser(storedUser);
        } else {
             console.warn("Stale user data found in localStorage. Clearing.");
             localStorage.removeItem(USER_STORAGE_KEY);
             setUser(null);
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage on initial load", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
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
      // First, get the user info before clearing it
      const currentUser = user;
      
      // Clear the session
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);

      // Now, if the logged-out user was 'سالن مد نهال', delete them permanently
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
