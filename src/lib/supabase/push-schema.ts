// This script uses the 'pg' library for a direct, reliable database connection
// to apply critical schema changes that cannot be done via standard migrations.
import * as dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const setupSmsProviderSql = `
  -- This SQL block ensures the custom SMS provider is configured for Supabase Auth.
  DO $$
  BEGIN
    -- Check if the config value is already set, to avoid unnecessary updates.
    IF NOT EXISTS (
        SELECT 1 FROM auth.config WHERE key = 'external_sms_provider' AND value = 'kavenegar-otp-sender'
    ) THEN
        -- Set our Kavenegar function as the official SMS provider for OTPs.
        UPDATE auth.config SET external_sms_provider = 'kavenegar-otp-sender';
        RAISE NOTICE '✅ Successfully set Supabase Auth SMS provider to: kavenegar-otp-sender';
    ELSE
        RAISE NOTICE '☑️ Supabase Auth SMS provider is already correctly set. No action needed.';
    END IF;
  END;
  $$;
`;

async function pushSchemaChanges() {
  console.log('--- Starting database schema setup ---');

  // Validate that the database connection string is available.
  const connectionString = process.env.SUPABASE_DB_CONNECTION_STRING;
  if (!connectionString) {
    console.error('❌ CRITICAL ERROR: SUPABASE_DB_CONNECTION_STRING is not set in your .env file.');
    console.error('Hint: Find it in your Supabase project dashboard under Project Settings > Database > Connection string (URI).');
    process.exit(1);
  }

  // Create a new database client
  const client = new Client({ connectionString });

  try {
    // Connect to the database
    console.log('Connecting to the database...');
    await client.connect();
    console.log('Connection successful.');

    // Execute the SQL statement
    console.log('Executing SQL to set up SMS provider...');
    await client.query(setupSmsProviderSql);
    console.log('SQL execution complete.');

  } catch (error: any) {
    // Log any errors that occur during the process
    console.error('❌ CRITICAL ERROR during schema setup:', error.message);
    process.exit(1); // Exit with an error code

  } finally {
    // Ensure the database client is always closed
    await client.end();
    console.log('Database connection closed.');
    console.log('--- Database schema setup finished ---');
  }
}

// Execute the main function.
pushSchemaChanges();
