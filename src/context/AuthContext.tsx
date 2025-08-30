'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// Combined AppUser type
export interface AppUser extends UserProfile {
  email: string;
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
  
  const router = useRouter();

  // Create the Supabase client once with the provided props
  const supabase = useMemo(() => {
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        const supabaseUser = session?.user;
        if (supabaseUser) {
          try {
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
                    account_type: userProfile.account_type,
                    phone: userProfile.phone,
                });
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

    // Check initial session
    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) setIsLoading(false);
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
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
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