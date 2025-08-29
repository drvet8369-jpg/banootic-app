
import { createBrowserClient } from '@supabase/ssr';
import getConfig from 'next/config';

// This function creates a Supabase client for the browser.
// It is safe to use in client components.
export const createClient = () => {
    // Read public environment variables from the Next.js runtime configuration.
    const { publicRuntimeConfig } = getConfig();
    const supabaseUrl = publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = publicRuntimeConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase client credentials not found. Check your next.config.js and .env.local files.");
        throw new Error("Client-side Supabase credentials are not available.");
    }
    
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
