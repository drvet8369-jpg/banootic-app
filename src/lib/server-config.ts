// This file contains server-side configuration that should not be exposed to the client.
// WARNING: Do not import this file into any client-side components.

// IMPORTANT: Replace "YOUR_VERY_SECURE_PASSWORD_HERE" with the actual complex password 
// you have set in your .env.local file for NEXT_PUBLIC_SUPABASE_MASTER_PASSWORD.
// This password must be the same in both places.
export const SUPABASE_MASTER_PASSWORD = "YOUR_VERY_SECURE_PASSWORD_HERE";
