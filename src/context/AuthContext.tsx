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
const BROADCAST_CHANNEL_NAME = 'honarbanoo-channel';
let authChannel: BroadcastChannel | null = null;


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
    // Initial load
    syncLoginState();
    
    // Create and listen to the broadcast channel
    if (typeof BroadcastChannel !== 'undefined') {
        authChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'auth_update') {
                syncLoginState();
            }
        };
        authChannel.addEventListener('message', handleMessage);

        return () => {
            authChannel?.removeEventListener('message', handleMessage);
            authChannel?.close();
            authChannel = null;
        };
    }
  }, [syncLoginState]);

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
      authChannel?.postMessage({ type: 'auth_update' });
      
    } catch (error) {
       console.error("Failed to save user to localStorage", error);
    }
  };
  
  const logout = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      authChannel?.postMessage({ type: 'auth_update' });
      
      if (window.location.pathname !== '/') {
        router.push('/');
      } else {
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
