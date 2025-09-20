// This file contains server-side configuration that should not be exposed to the client.
// WARNING: Do not import this file into any client-side components.

// By hardcoding these values here and only importing this file in server-side code
// (like Server Actions), we ensure they are never bundled with client-side JavaScript.
// This is a secure approach when environment variable management on the platform is problematic.

// IMPORTANT: Replace these placeholder values with your actual secrets.
// You can copy them from your .env file.

export const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Z25zaGZuZ2N5eGthbWFwZWpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzU2NTAxMCwiZXhwIjoyMDM5MTQxMDEwfQ.9eY5lfkECp24fHT3s-0q_j-a-3i_xB1LpA1V3S3aW9w";

export const SUPABASE_MASTER_PASSWORD = "your-strong-master-password-for-otp-users";

export const KAVEHNEGAR_API_KEY = "your-kavenegar-api-key";
