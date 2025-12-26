'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { normalizeForSupabaseAuth } from '@/lib/utils';

interface AuthContextType {
  session: Session | null;
  user: Profile | null; // This is our custom Profile type from the database
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = 0 rows returned
              console.error('Error fetching profile:', error);
            }

            setUser(profile ?? null);

            // IMPORTANT LOGIC: If user has a session but no profile, and isn't already on the register page,
            // they MUST complete their profile.
            if (!profile && !pathname.startsWith('/register') && session.user.phone) {
               console.log("AuthContext: User has session but no profile. Redirecting to /register.");
               // Use a hard reload to ensure all server components re-evaluate with the new session.
               window.location.href = `/register?phone=${session.user.phone}`;
            }

          } catch (e) {
            console.error("An error occurred fetching user profile:", e);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  // We want this to run only once on mount, so we disable exhaustive-deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
