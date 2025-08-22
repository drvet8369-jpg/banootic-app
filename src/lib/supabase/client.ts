import { createBrowserClient } from '@supabase/ssr';

// This function creates a Supabase client for the browser.
// It is safe to use in client components.
export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase client credentials not found. Check NEXT_PUBLIC_ environment variables.");
        throw new Error("Client-side Supabase credentials are not available.");
    }
    
    return createBrowserClient(supabaseUrl, supabaseKey);
};