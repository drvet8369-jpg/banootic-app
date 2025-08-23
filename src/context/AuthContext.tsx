'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string; // The user's Supabase UUID
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session) {
        // User is logged in. Now, fetch their profile details from our tables.
        const profile = await getUserProfile(session.user);
        if (profile) {
          setUser(profile);
        } else {
          // This case might happen if a user exists in Supabase auth but not in our tables.
          // For robustness, log them out.
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        // User is not logged in.
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, supabase.auth]);

  const getUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const { data: providerProfile } = await supabase
        .from('providers')
        .select('name, phone')
        .eq('id', supabaseUser.id)
        .single();
    
    if (providerProfile) {
        return { id: supabaseUser.id, name: providerProfile.name, phone: providerProfile.phone, accountType: 'provider' };
    }
    
    const { data: customerProfile } = await supabase
        .from('customers')
        .select('name, phone')
        .eq('id', supabaseUser.id)
        .single();

    if (customerProfile) {
        return { id: supabaseUser.id, name: customerProfile.name, phone: customerProfile.phone, accountType: 'customer' };
    }
    
    console.error("User profile not found in 'providers' or 'customers' table for user ID:", supabaseUser.id);
    return null;
  }

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null); // The onAuthStateChange listener will also handle this, but we do it here for immediate UI feedback.
    router.push('/');
    router.refresh(); // Force a refresh to clear any cached user-specific data.
    setIsLoading(false);
  };

  const contextValue = {
    isLoggedIn: !!user,
    user,
    isLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
