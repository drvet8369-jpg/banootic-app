'use client';

import { createBrowserClient } from '@supabase/ssr';

// This is the standard and recommended way to create a client-side Supabase client.
// It will automatically handle cookie management for both client and server components.
export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase credentials not provided. Please check your .env.local file.");
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
    );
};
