'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';

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
// Mock Provider for testing
// --------------------
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Mock a logged-in customer user for UI testing purposes
  const mockUser: SupabaseUser = {
    id: 'mock-customer-id',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: 'مشتری آزمایشی' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const mockProfile: Profile = {
    id: 'mock-customer-id',
    account_type: 'customer',
    full_name: 'مشتری آزمایشی',
    phone: '09123456789',
    profile_image_url: null,
    portfolio: [],
    service_id: null,
  };

  const value: AuthContextType = {
    session: null, // Session can be null in mock mode
    user: mockUser,
    profile: mockProfile,
    isLoggedIn: true,
    loading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


// --------------------
// Main Provider
// --------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // If mock data mode is on, use the mock provider to avoid real auth
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  const supabase = createClient();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      // Refresh the page on sign-in or sign-out to ensure server components re-render
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


// --------------------
// Hook
// --------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
