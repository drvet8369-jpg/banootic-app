// This file contains server-side configuration that should not be exposed to the client.
// WARNING: Do not import this file into any client-side components.

// This master password is read from environment variables for security.
// It is used by the server to bootstrap new user accounts via OTP.
export const SUPABASE_MASTER_PASSWORD = process.env.SUPABASE_MASTER_PASSWORD;

if (!SUPABASE_MASTER_PASSWORD) {
  // In a real production environment, you might want to throw an error here.
  // For this development environment, we'll log a strong warning.
  console.warn(
    'CRITICAL WARNING: SUPABASE_MASTER_PASSWORD is not set in environment variables. User creation will fail.'
  );
}
