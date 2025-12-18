import { createClient } from '@supabase/supabase-js';

// This file is specifically for creating a Supabase admin client.
// This client has admin privileges and should only be used in
// secure server-side environments (like Server Actions or Route Handlers).
// It must never be exposed to the client-side.

let adminClient: ReturnType<typeof createClient> | null = null;

export const createAdminClient = () => {
  // Singleton pattern: if the client is already created, return it.
  if (adminClient) {
    return adminClient;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not set in environment variables for admin client.');
  }

  // Create and store the client for future use.
  adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  return adminClient;
};
