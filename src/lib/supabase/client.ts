import { createBrowserClient } from '@supabase/ssr';

// This function creates a Supabase client for the browser.
// It is safe to use in client components.
export const createClient = (supabaseUrl: string, supabaseAnonKey: string) => {
    if (!supabaseUrl || !supabaseAnonKey) {
        // This check will now happen inside the AuthProvider.
        throw new Error("Client-side Supabase credentials are not available.");
    }
    
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
