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

const USER_STORAGE_KEY = 'honarbanoo-user';
const BROADCAST_CHANNEL_NAME = 'honarbanoo-auth-channel';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  // This function is the single source of truth for loading user state
  const syncAuthState = useCallback(() => {
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
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // Initial load for the current tab
    syncAuthState();
    
    // Listen for storage changes from other tabs to stay in sync
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USER_STORAGE_KEY) {
        syncAuthState();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen to BroadcastChannel for more immediate sync
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const handleChannelMessage = (event: MessageEvent) => {
        if (event.data.type === 'auth_change') {
            syncAuthState();
        }
    };
    channel.addEventListener('message', handleChannelMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      channel.removeEventListener('message', handleChannelMessage);
      channel.close();
    };
  }, [syncAuthState]);

  const postAuthChange = () => {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'auth_change' });
      channel.close();
  };
  
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
      postAuthChange();
      
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };
  
  const logout = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      postAuthChange();
      
      if (window.location.pathname !== '/') {
        router.push('/');
      } else {
        // A reload is sometimes necessary if state is not propagating correctly in complex layouts
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
