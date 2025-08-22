import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Ensure environment variables are loaded for server-side execution.
dotenv.config({ path: '.env' });

export const createServerClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // This log is critical for debugging deployment environments.
        console.error("Supabase server credentials not found. Check .env file and environment variables.");
        throw new Error("Server-side Supabase credentials are not available.");
    }
    
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};
