
// This script is designed to be run from the command line to apply necessary database schema changes,
// such as creating hooks, which cannot be done through standard migration files.

import *re from 'readline';
import *re2 from 'node:readline';
import *re3 from 'readline/promises';
import { createAdminClient } from './admin';

// This is the core SQL statement to set up the authentication hook.
// It links the 'password_updated' event to our custom SMS sender function.
const setupSmsProviderSql = `
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_event_trigger WHERE evtname = 'supabase_api_change'
   ) THEN
      CREATE OR REPLACE FUNCTION public.set_sms_provider()
      RETURNS event_trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        UPDATE auth.config SET external_sms_provider = 'kavenegar-otp-sender';
        RAISE NOTICE 'Supabase Auth SMS provider hook set to kavenegar-otp-sender';
      END;
      $function$;

      CREATE EVENT TRIGGER supabase_api_change
      ON ddl_command_end
      WHEN TAG IN ('CREATE FUNCTION', 'ALTER FUNCTION', 'CREATE SCHEMA', 'ALTER SCHEMA')
      EXECUTE FUNCTION public.set_sms_provider();

      RAISE NOTICE 'Event trigger supabase_api_change created.';
   ELSE
      RAISE NOTICE 'Event trigger supabase_api_change already exists, skipping creation.';
   END IF;
   
   -- Also ensure the setting is correct right now, in case the trigger didn't run.
   UPDATE auth.config SET external_sms_provider = 'kavenegar-otp-sender';
END;
$$;
`;


async function pushSchemaChanges() {
    console.log('--- Starting database schema setup ---');
    try {
        const supabase = createAdminClient();
        console.log('Admin client created. Attempting to execute SQL...');

        // Use the standard .query() method to execute the raw SQL statement.
        // This is the most direct and reliable way to perform this operation.
        const { error } = await supabase.query(setupSmsProviderSql);

        if (error) {
            // If an error occurs, throw it to be caught by the catch block.
            throw error;
        }

        console.log('✅ Successfully set up Supabase Auth SMS provider hook.');
        console.log('--- Database schema setup finished ---');

    } catch (error: any) {
        console.error('❌ CRITICAL ERROR during schema setup:', error.message);
        // Provide a clearer message if it's a connection issue.
        if (error.message.includes('ECONNREFUSED')) {
            console.error('Hint: Could not connect to the database. Is the Supabase local environment running? (npm run dev)');
        }
        process.exit(1); // Exit with an error code.
    }
}

// Execute the main function.
pushSchemaChanges();
