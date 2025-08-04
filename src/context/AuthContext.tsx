'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProviders } from '@/lib/data'; // Import the function to get provider data

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A one-time check to see if we need to clean up localStorage
const performCleanup = () => {
    if (typeof window !== 'undefined') {
        const cleanupFlag = 'banootik-cleanup-v1'; // Use a new flag to re-run if needed for the new brand
        if (!localStorage.getItem(cleanupFlag)) {
            console.log("Performing one-time data refresh for new brand: Banootik...");
            localStorage.removeItem('banootik-providers'); 
            localStorage.removeItem('banootik-users'); 
            localStorage.removeItem('banootik-reviews'); 
            localStorage.removeItem('banootik-agreements'); 
            localStorage.removeItem('banootik_inbox_chats');
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
      const storedUserJSON = localStorage.getItem('banootik-user');
      if (storedUserJSON) {
        const storedUser: User = JSON.parse(storedUserJSON);
        
        // **RECOVERY LOGIC**
        // If the user is a provider, ensure their data is complete by cross-referencing with the master provider list.
        // This solves the inconsistency between tabs and the preview window.
        if (storedUser.accountType === 'provider') {
          const allProviders = getProviders();
          const fullProviderProfile = allProviders.find(p => p.phone === storedUser.phone);
          
          if (fullProviderProfile) {
            // Found the full profile, create a complete user object
            const completeUser: User = {
                name: fullProviderProfile.name,
                phone: fullProviderProfile.phone,
                accountType: 'provider',
                service: fullProviderProfile.service,
                bio: fullProviderProfile.bio,
            };
            // Re-sync localStorage with the complete, correct data and set state
            localStorage.setItem('banootik-user', JSON.stringify(completeUser));
            setUser(completeUser);
          } else {
             // The provider is not in the master list, maybe a registration error. Log them out.
             console.warn(`Provider with phone ${storedUser.phone} not found in master list. Logging out.`);
             logout();
          }
        } else {
          // User is a customer, just set the state
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage on initial load", error);
      // Clean up corrupted data
      localStorage.removeItem('banootik-user');
    }
  }, []);

  const login = (userData: User) => {
    try {
      // Ensure accountType is always set
      const userToSave = { ...userData, accountType: userData.accountType || 'customer' };
      localStorage.setItem('banootik-user', JSON.stringify(userToSave));
      setUser(userToSave);
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('banootik-user');
      setUser(null);
      // Redirect to home page for a better user experience
      router.push('/');
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, login, logout }}>
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
