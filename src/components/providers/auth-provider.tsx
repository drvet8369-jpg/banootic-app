'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';

type SupabaseClient = ReturnType<typeof createClient>;

// --------------------
// Context
// --------------------
interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  isLoggedIn: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --------------------
// Main Provider
// --------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState<SupabaseClient | null>(() => {
    try {
      return createClient();
    } catch (error) {
      // This will catch the error thrown by createClient if env vars are missing/invalid
      console.warn('Supabase client failed to initialize:', (error as Error).message);
      return null;
    }
  });

  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
        setLoading(false);
        return;
    }
    
    const fetchProfile = async (currentSession: Session) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
        setProfile(data ?? null);
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    // Run once on mount to get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchProfile(session);
      } else {
        setProfile(null);
      }
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const value = { 
    session, 
    user: session?.user ?? null,
    profile, 
    isLoggedIn: !!session && !!profile,
    loading 
  };
  
  // If the supabase client could not be created, the layout will show an error page.
  // We return the children directly, which prevents a client-side crash and lets the
  // server-rendered error page persist.
  if (!supabase) {
    return <>{children}</>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --------------------
// Hook
// --------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This state can be reached if the AuthProvider fails to initialize the client.
    // Instead of throwing an error, we return a safe, "logged-out" default state.
    // This prevents crashes in child components that rely on this hook.
    return {
        session: null,
        user: null,
        profile: null,
        isLoggedIn: false,
        loading: false, // We're not loading if we've already failed.
    };
  }
  return context;
}
