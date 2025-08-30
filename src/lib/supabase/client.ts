import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// This function creates a Supabase client for the browser.
// It is safe to use in client components.

// This ensures we have a single instance of the client in the browser.
let client: SupabaseClient | undefined;

export const createClient = () => {
    if (client) {
        return client;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return client;
};
