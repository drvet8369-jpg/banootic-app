import { createClient } from '@supabase/supabase-js';

export const createClientClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // This log is critical for debugging client-side issues.
        console.error("Supabase client credentials not found. Check NEXT_PUBLIC_ environment variables.");
        throw new Error("Client-side Supabase credentials are not available.");
    }

    return createClient(supabaseUrl, supabaseKey);
};
