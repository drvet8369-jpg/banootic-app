// This file contains server-side configuration that should not be exposed to the client.
// WARNING: Do not import this file into any client-side components.

// By hardcoding these values here and only importing this file in server-side code
// (like Server Actions), we ensure they are never bundled with client-side JavaScript.
// This is a secure approach when environment variable management on the platform is problematic.

// IMPORTANT: Replace the placeholder values for the service role key and Kavenegar API key.
// You can copy them from your provider dashboards.

export const SUPABASE_SERVICE_ROLE_KEY = "your-supabase-service-role-key-here";

export const SUPABASE_MASTER_PASSWORD = "MasterPassword-sUpA-bAn0t1k-2o24!";

export const KAVEHNEGAR_API_KEY = "your-kavenegar-api-key-here";
