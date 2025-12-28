'use client';

import { createBrowserClient } from '@supabase/ssr';

// This is the standard and recommended way to create a client-side Supabase client.
// It will automatically handle cookie management for both client and server components.
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
