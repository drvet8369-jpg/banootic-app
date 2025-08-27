
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// IMPORTANT: Never use these clients on the client-side.
// They are intended for server-side operations only.

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

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value, ...options });
                } catch (error) {
                    // This can happen in Server Components. It's safe to ignore.
                }
            },
            remove(name: string, options: CookieOptions) {
                 try {
                    cookieStore.set({ name, value: '', ...options });
                } catch (error) {
                    // This can happen in Server Components. It's safe to ignore.
                }
            },
        },
    });
};
