import { createBrowserClient } from '@supabase/ssr';

// This function creates a Supabase client for the browser.
// It is safe to use in client components.
export const createClient = (supabaseUrl: string, supabaseAnonKey: string) => {
    if (!supabaseUrl || !supabaseAnonKey) {
        // This error will be thrown if the environment variables are not passed correctly from RootLayout.
        console.error("Supabase client credentials not provided to createClient function.");
        throw new Error("Client-side Supabase credentials are not available.");
    }
    
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
