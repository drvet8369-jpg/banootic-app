import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// IMPORTANT: Never use this client on the client-side.
// It is intended for server-side operations only, like in API Routes or Server Actions.

// This function creates a Supabase admin client that can perform operations
// with elevated privileges, bypassing RLS policies when necessary.
// It uses the SERVICE_ROLE_KEY.
export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Supabase server credentials for admin client not found. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
        throw new Error("Server-side Supabase admin credentials are not available.");
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};

// This function creates a Supabase client for a server component or API route
// that acts on behalf of the currently logged-in user by reading their auth cookie.
// It uses the ANON_KEY and the user's JWT.
export const createServerComponentClient = () => {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase client credentials for server components not found. Check NEXT_PUBLIC_ environment variables.");
        throw new Error("Client-side Supabase credentials for server components are not available.");
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: {
              getItem: (key) => {
                const value = cookieStore.get(key)?.value;
                return value ?? null;
              },
              setItem: (key, value) => {
                cookieStore.set(key, value);
              },
              removeItem: (key) => {
                cookieStore.delete(key);
              },
            },
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    });
};

    