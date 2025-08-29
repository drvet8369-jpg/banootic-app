'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';

// The user object shape used within our React application.
export interface AppUser {
  id: string; // The user_id from the DB (UUID)
  name: string;
  email: string; 
  accountType: 'customer' | 'provider';
  phone: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: AppUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  supabase: SupabaseClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const AuthProvider = ({ children, supabaseUrl, supabaseAnonKey }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      // This check is a safeguard, but the layout should always provide the props.
      throw new Error("Supabase credentials were not provided to AuthProvider.");
    }
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);
  
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        if (session?.user) {
          const supabaseUser = session.user;
          
          try {
            // Fetch the user's profile from our public.users table
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('id, name, account_type, phone')
              .eq('id', supabaseUser.id)
              .single();
            
            if (error) {
                console.error("Error fetching user profile:", error);
                await supabase.auth.signOut();
                setUser(null);
            } else if (userProfile) {
                 setUser({
                    id: userProfile.id,
                    email: supabaseUser.email!,
                    name: userProfile.name,
                    accountType: userProfile.account_type,
                    phone: userProfile.phone,
                });
            } else {
                console.warn(`User ${supabaseUser.id} found in auth but not in public.users. Logging out.`);
                await supabase.auth.signOut();
                setUser(null);
            }
          } catch(e) {
             console.error("Critical error fetching user profile:", e);
             await supabase.auth.signOut();
             setUser(null);
          }

        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

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
    router.push('/');
  };
  
  const value = {
    isLoggedIn: !isLoading && !!user,
    user,
    isLoading,
    logout,
    supabase,
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
