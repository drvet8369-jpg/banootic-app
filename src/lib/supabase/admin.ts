import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '@/lib/server-config';

// This file is specifically for creating a Supabase admin client.
// This client has admin privileges and should only be used in
// secure server-side environments (like Server Actions or Route Handlers).
// It must never be exposed to the client-side.

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = SUPABASE_SERVICE_ROLE_KEY;


  if (!supabaseUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey.includes('your-supabase-service-role-key-here')) {
    throw new Error('Supabase URL or Service Role Key is not set in server-config.ts.');
  }

  // When using the service_role key, we should disable session persistence.
  // This correctly creates a client with admin privileges.
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
