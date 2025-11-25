// This file is for server-side configuration only.
// It will never be exposed to the client.

// IMPORTANT: Replace these placeholder values with your actual secret keys.
// These are read by server-side code (Server Actions, Route Handlers).

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key-here';

export const SUPABASE_MASTER_PASSWORD = process.env.SUPABASE_MASTER_PASSWORD || 'your-supabase-master-password-here';

export const KAVEHNEGAR_API_KEY = 'YOUR_KAVEHNEGAR_API_KEY_HERE';

if (KAVEHNEGAR_API_KEY === 'YOUR_KAVEHNEGAR_API_KEY_HERE') {
  console.warn('Kavenegar API Key is not set in src/lib/server-config.ts. OTP sending will fail.');
}
