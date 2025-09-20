// This file contains server-side configuration that should not be exposed to the client.
// WARNING: Do not import this file into any client-side components.

// By hardcoding these values here and only importing this file in server-side code
// (like Server Actions), we ensure they are never bundled with client-side JavaScript.
// This is a secure approach when environment variable management on the platform is problematic.

// IMPORTANT: Replace the placeholder values for the service role key and Kavenegar API key.
// You can copy them from your provider dashboards.

export const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaXlidmxxZGlidHdja2Jnc2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQxOTI2OSwiZXhwIjoyMDcwOTk1MjY5fQ.TGG74bK8SIJr2NeOvN2XE_BM1bgcpp8of78HfgQxKRY";

export const SUPABASE_MASTER_PASSWORD = "MasterPassword-sUpA-bAn0t1k-2o24!";

export const KAVEHNEGAR_API_KEY = "425A38756C724A503571315964352B4E416946316754754B33616B7652526E6B706779327131496F756A453D";
