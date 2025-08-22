import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Never use this client on the client-side.
// It is intended for server-side operations only.

export const createServerClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase server credentials not found. Check .env file and environment variables on your deployment platform.");
        throw new Error("Server-side Supabase credentials are not available.");
    }
    
    // Create and export the client
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};