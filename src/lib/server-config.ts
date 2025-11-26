// This file is for server-side configuration only.
// It will never be exposed to the client.

// IMPORTANT: Replace these placeholder values with your actual secret keys.
// These are read by server-side code (Server Actions, Route Handlers).

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaXlidmxxZGlidHdja2Jnc2N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQxOTI2OSwiZXhwIjoyMDcwOTk1MjY5fQ.TGG74bK8SIJr2NeOvN2XE_BM1bgcpp8of78HfgQxKRY';

export const SUPABASE_MASTER_PASSWORD = process.env.SUPABASE_MASTER_PASSWORD || 'gS$t8!zP#kL@wE&q9R*v';

export const KAVEHNEGAR_API_KEY = '425A38756C724A503571315964352B4E416946316754754B33616B7652526E6B706779327131496F756A453D';

if (KAVEHNEGAR_API_KEY === '425A38756C724A503571315964352B4E416946316754754B33616B7652526E6B706779327131496F756A453D') {
  console.warn('Kavenegar API Key is not set in src/lib/server-config.ts. OTP sending will fail.');
}
