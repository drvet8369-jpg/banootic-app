'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { UserProfile, Provider, PortfolioItem } from '@/lib/types';
import { getProviderByUserId } from '@/lib/api';

// This combines all user-related data into a single, comprehensive object.
export interface AppUser extends UserProfile {
  provider_details?: Provider;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: AppUser | null;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndProvider = async (supabaseUser: SupabaseUser) => {
        try {
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (profileError) throw profileError;

            let appUser: AppUser = { ...userProfile };

            if (userProfile.account_type === 'provider') {
                const providerDetails = await getProviderByUserId(supabaseUser.id);
                if (providerDetails) {
                    appUser.provider_details = providerDetails;
                }
            }
            setUser(appUser);
        } catch (error) {
            console.error("Error fetching user profile or provider details:", error);
            setUser(null); // Clear user state on error
        }
    };
    
    // Check for an existing session on initial load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchUserAndProvider(session.user);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserAndProvider(session.user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = {
    isLoggedIn: !!user,
    isLoading,
    user,
    session,
  };

  return (
    <AuthContext.Provider value={value}>
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
