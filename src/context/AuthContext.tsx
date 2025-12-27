
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

interface AuthContextType {
  session: Session | null;
  user: Profile | null; // This is our custom Profile type from the database
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function fetches the profile based on the session.
    const fetchProfile = async (session: Session) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for a new user.
          console.error('Error fetching profile:', error.message);
          setUser(null);
        } else {
          setUser(profile ?? null);
        }
      } catch (e) {
        console.error("A critical error occurred fetching user profile:", e);
        setUser(null);
      }
    };
    
    // First, get the initial session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });


    // Then, listen for auth state changes.
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          // If a new session comes in, fetch the profile again.
          await fetchProfile(session);
        } else {
          // If session is null, there is no user.
          setUser(null);
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const value = { session, user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
