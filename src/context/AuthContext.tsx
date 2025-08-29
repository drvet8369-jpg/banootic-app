
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getProviderByPhone, getCustomerByPhone } from '@/lib/api';

// This is the user object shape used within our React application.
// It combines Supabase's auth user with our public user profile data.
export interface AppUser {
  id: string; // This is the user_id from the DB (UUID)
  name: string;
  phone: string; 
  accountType: 'customer' | 'provider';
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: AppUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        if (session?.user) {
          const supabaseUser = session.user;
          // After getting the session, we need to fetch our public profile
          // to get the accountType and full name.
          let profile: { name: string; accountType: 'provider' | 'customer' } | null = null;
          
          const providerProfile = await getProviderByPhone(supabaseUser.phone!);
          if (providerProfile) {
            profile = { name: providerProfile.name, accountType: 'provider' };
          } else {
            const customerProfile = await getCustomerByPhone(supabaseUser.phone!);
            if (customerProfile) {
              profile = { name: customerProfile.name, accountType: 'customer' };
            }
          }

          if (profile) {
            setUser({
              id: supabaseUser.id,
              phone: supabaseUser.phone!,
              name: profile.name,
              accountType: profile.accountType
            });
          } else {
            // This case might happen if a user exists in auth but not in our public tables.
            // Log them out to force a clean registration.
            console.warn("User exists in Supabase Auth but not in public profiles. Logging out.");
            await supabase.auth.signOut();
            setUser(null);
          }

        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Initial check for session
    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setIsLoading(false);
        }
    };
    checkInitialSession();


    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
    // Redirect to home to ensure a clean state
    window.location.href = '/';
  };
  
  // The login function is no longer needed here as the onAuthStateChange listener handles everything.
  // We keep the context shape for consumers but the function will be handled by Supabase sign-in methods.
  const value = {
    isLoggedIn: !isLoading && !!user,
    user,
    isLoading,
    logout,
    // login is removed from the provider value
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
         <div className="flex justify-center items-center h-screen w-full">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      ) : (
        children
      )}
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
