// This file is for server-side configuration only.
// It will never be exposed to the client.

// IMPORTANT: Replace these placeholder values with your actual secret keys.
// These are read by server-side code (Server Actions, Route Handlers).

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaXlidmxxZGlidHdja2Jnc2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQxOTI2OSwiZXhwIjoyMDcwOTk1MjY5fQ.TGG74bK8SIJr2NeOvN2XE_BM1bgcpp8of78HfgQxKRY'

export const SUPABASE_MASTER_PASSWORD = process.env.SUPABASE_MASTER_PASSWORD || 'gS$t8!zP#kL@wE&q9R*v'

// Kavenegar key is no longer needed here as it's self-contained in the API route.
