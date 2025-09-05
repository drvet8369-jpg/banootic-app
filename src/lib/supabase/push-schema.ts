// This is a helper script to apply SQL changes to the database.
// It reads all .sql files from the current directory and executes them.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createAdminClient } from './admin'; // Use the new admin client
import fs from 'fs/promises';
import path from 'path';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not set.");
    process.exit(1);
}

const supabase = createAdminClient();

// Helper function to run arbitrary SQL. We need to create this function in the DB first.
const createExecuteSqlFn = async () => {
    const { error } = await supabase.rpc('execute_sql', {
        sql: `
            CREATE OR REPLACE FUNCTION execute_sql(sql text)
            RETURNS void
            LANGUAGE plpgsql
            AS $$
            BEGIN
                EXECUTE sql;
            END;
            $$;
        `,
    });
     // It's okay if the function already exists.
    if (error && error.code !== '42723') { 
        console.error('Failed to create helper function `execute_sql`', error);
        throw error;
    }
}

// This function creates the necessary hook to link our Kavenegar function to Supabase Auth.
async function setupAuthHook() {
    console.log('Setting up Supabase auth hook for custom SMS provider...');

    // The URI of our deployed Edge Function
    const KAVENEGAR_FUNCTION_URI = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/kavenegar-otp-sender`;

    const { error } = await supabase.rpc('execute_sql', {
        sql: `
            -- 1. Create the hook function that calls our Edge Function
            create or replace function public.kavenegar_sms_sender(phone text, token text)
            returns json
            language plv8
            as $$
                -- Make a POST request to our Edge Function
                const response = plv8.execute(
                    'SELECT content FROM http_post(
                        ''${KAVENEGAR_FUNCTION_URI}'',
                        json_build_object(
                            ''phone'', phone,
                            ''data'', json_build_object(''token'', token)
                        )::text,
                        ''application/json'',
                        json_build_object(
                            ''Authorization'', ''Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}''
                        )::text
                    )'
                );
                
                return response[0].content;
            $$;

            -- 2. Grant usage permission to the necessary roles
            grant execute on function public.kavenegar_sms_sender(text, text) to supabase_auth_admin;
            grant usage on schema public to supabase_auth_admin;

            -- 3. Register the hook in the Supabase Auth configuration
            UPDATE auth.settings SET hook_sms_provider = 'kavenegar_sms_sender';

            -- 4. Re-load the configuration so the changes take effect immediately
            -- This step is often needed to make the auth service aware of the hook.
            SELECT net.http_post(
                url:='${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/config',
                headers:=jsonb_build_object(
                    'apikey', '${process.env.SUPABASE_SERVICE_ROLE_KEY}',
                    'Authorization', 'Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}'
                ),
                body:=jsonb_build_object('hook_sms_provider_enabled', true)
            ) as "response";
        `,
    });

    if (error) {
      console.error('CRITICAL ERROR setting up auth hook:', error);
      throw error;
    }

    console.log('✅ Successfully configured custom SMS provider hook.');
}

async function main() {
    try {
        console.log("Ensuring 'execute_sql' helper function exists...");
        await createExecuteSqlFn();
        console.log("Setting up authentication hook...");
        await setupAuthHook();
        console.log('Database setup complete.');
    } catch(e) {
        console.error("An error occurred during database setup:", e);
        process.exit(1);
    }
}

main();
