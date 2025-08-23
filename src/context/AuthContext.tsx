'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as AuthUser } from '@supabase/supabase-js';

export interface AppUser {
  id: string; // This is the UUID from auth.users
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: AppUser | null;
  isLoading: boolean;
  login: (userData: AppUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session && session.user) {
        const appUser: AppUser = {
          id: session.user.id,
          name: session.user.user_metadata.name,
          phone: session.user.user_metadata.phone,
          accountType: session.user.user_metadata.account_type,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Check initial state
     const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
             const appUser: AppUser = {
                id: session.user.id,
                name: session.user.user_metadata.name,
                phone: session.user.user_metadata.phone,
                accountType: session.user.user_metadata.account_type,
             };
             setUser(appUser);
        }
        setIsLoading(false);
     };

     checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const login = (userData: AppUser) => {
    // This function is now mostly a placeholder as onAuthStateChange handles the state.
    // It could be used for manually setting state if needed, but we'll rely on the listener.
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh(); // Force a refresh to clear all state
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, isLoading, login, logout }}>
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
