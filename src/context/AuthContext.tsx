'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { getProviderByUserId } from '@/lib/api';

export interface AppUser {
  id: string;
  name: string;
  email: string | undefined;
  phone: string;
  accountType: 'customer' | 'provider';
  // Optional provider-specific fields, will be populated if user is a provider
  providerDetails?: {
    service?: string;
    bio?: string;
    category_slug?: string;
    service_slug?: string;
    location?: string;
  };
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
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        if (session) {
          const supabaseUser = session.user;
          const appUser: AppUser = {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || '',
            email: supabaseUser.email,
            phone: supabaseUser.phone || supabaseUser.user_metadata?.phone || '',
            accountType: supabaseUser.user_metadata?.account_type || 'customer',
          };

          // If the user is a provider, fetch their detailed provider info
          if (appUser.accountType === 'provider') {
            try {
                const providerDetails = await getProviderByUserId(appUser.id);
                if (providerDetails) {
                    appUser.providerDetails = {
                        service: providerDetails.service,
                        bio: providerDetails.bio,
                        category_slug: providerDetails.category_slug,
                        service_slug: providerDetails.service_slug,
                        location: providerDetails.location,
                    }
                }
            } catch (error) {
                console.error("Failed to fetch provider details for logged-in user:", error);
            }
          }
          setUser(appUser);
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

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, isLoading, logout }}>
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
