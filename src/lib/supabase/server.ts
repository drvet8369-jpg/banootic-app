import { createClient } from '@supabase/supabase-js';

// This function creates a Supabase client for server-side operations.
// It uses environment variables that should only be available on the server.
export const createServerClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Server-side Supabase credentials are not available.");
    }
    
    // Create and return the client for a single server-side operation.
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};
