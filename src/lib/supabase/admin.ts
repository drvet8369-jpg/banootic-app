// This file is specifically for creating a Supabase admin client
// in a pure Node.js environment (like scripts) where Next.js-specific
// modules like 'next/headers' are not available.

import { createClient } from '@supabase/supabase-js'

// IMPORTANT: This client has admin privileges and should only be used in
// secure server-side scripts. It must never be exposed to the client-side.
export const createAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase URL or Service Role Key is not set in environment variables.');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
};
