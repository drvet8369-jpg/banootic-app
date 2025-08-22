import { createClient } from '@supabase/supabase-js';

// This function creates a Supabase client for client-side (browser) operations.
// It uses environment variables that are prefixed with NEXT_PUBLIC_ to be exposed to the browser.
export const createClientClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Client-side Supabase credentials are not available.");
    }

    return createClient(supabaseUrl, supabaseKey);
};
