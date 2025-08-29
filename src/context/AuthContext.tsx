'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getProviderByUserId } from '@/lib/api';

// The user object shape used within our React application.
export interface AppUser {
  id: string; // The user_id from the DB (UUID)
  name: string;
  email: string; 
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
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        if (session?.user) {
          const supabaseUser = session.user;
          
          try {
            const { data: appUserData, error } = await supabase
              .from('users')
              .select('id, name, account_type')
              .eq('id', supabaseUser.id)
              .single();
            
            if (error) throw error;
            
            if (appUserData) {
                 setUser({
                    id: appUserData.id,
                    email: supabaseUser.email!,
                    name: appUserData.name,
                    accountType: appUserData.account_type as 'customer' | 'provider',
                });
            } else {
                // This case can happen if a user exists in auth but not in our public.users table
                // Log them out to force a clean registration
                await supabase.auth.signOut();
                setUser(null);
            }
          } catch(e) {
             console.error("Error fetching user profile:", e);
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
    router.push('/');
  };
  
  const value = {
    isLoggedIn: !isLoading && !!user,
    user,
    isLoading,
    logout,
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
