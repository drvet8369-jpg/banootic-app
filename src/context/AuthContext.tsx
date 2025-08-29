'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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

const ConfigErrorScreen = ({ message, instructions }: { message: string; instructions: string }) => (
  <div className="flex flex-col items-center justify-center h-screen w-full bg-red-50 text-red-900 p-4">
    <div className="text-center max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">{message}</h1>
      <p className="text-lg mb-2">مقادیر لازم برای اتصال به پایگاه داده در فایل <strong>.env.local</strong> شما یافت نشد یا نامعتبر بودند.</p>
      <code className="block bg-red-100 p-4 rounded-md text-left text-sm my-4 whitespace-pre-wrap">
        {`# .env.local
NEXT_PUBLIC_SITE_URL="http://localhost:9002"
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_KEY_HERE"
`}
      </code>
      <p className="text-lg font-semibold">{instructions}</p>
    </div>
  </div>
);


export const AuthProvider = ({ children, supabaseUrl, supabaseAnonKey }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  
  const router = useRouter();

  const supabase = useMemo(() => {
    if (!supabaseUrl || supabaseUrl.includes("YOUR_SUPABASE_URL")) {
      setConfigError("Supabase URL is not configured.");
      return null;
    }
    if (!supabaseAnonKey || supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY")) {
       setConfigError("Supabase Anon Key is not configured.");
       return null;
    }
    setConfigError(null);
    return createClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (!supabase) {
        setIsLoading(false);
        return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true);
        if (session?.user) {
          const supabaseUser = session.user;
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

    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) setIsLoading(false);
    };
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  
  if (configError) {
      return <ConfigErrorScreen message={configError} instructions="لطفاً فایل .env.local را تکمیل کرده و سرور را مجدداً راه‌اندازی (Restart) کنید." />;
  }

  const logout = async () => {
    if (!supabase) return;
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
    supabase: supabase!,
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
