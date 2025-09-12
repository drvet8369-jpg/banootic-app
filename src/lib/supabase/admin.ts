// This file is specifically for creating a Supabase admin client.
// This client has admin privileges and should only be used in
// secure server-side environments (like Server Actions or Route Handlers).
// It must never be exposed to the client-side.

import { createClient } from '@supabase/supabase-js';

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not set in environment variables.');
  }

  // When using the service_role key, we should disable session persistence.
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
