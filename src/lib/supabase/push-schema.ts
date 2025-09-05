// This is a helper script to apply SQL changes to the database.
// It reads all .sql files from the current directory and executes them.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createAdminClient } from './admin';
import fs from 'fs/promises';
import path from 'path';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not set.");
    process.exit(1);
}

const supabase = createAdminClient();

// This function creates the necessary hook to link our Kavenegar function to Supabase Auth.
async function setupAuthHook() {
    console.log('Setting up Supabase auth hook for custom SMS provider...');

    // The URI of our deployed Edge Function
    const KAVENEGAR_FUNCTION_URI = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/kavenegar-otp-sender`;

    const sqlCommands = `
        -- 1. Create the hook function that calls our Edge Function
        -- This function will be called by Supabase Auth whenever an OTP is needed.
        CREATE OR REPLACE FUNCTION public.kavenegar_sms_sender(phone text, token text)
        RETURNS json
        LANGUAGE plv8
        AS $$
            // Make a POST request to our Edge Function
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

        -- 2. Grant usage permission to the necessary roles so Auth can use the function
        GRANT EXECUTE ON FUNCTION public.kavenegar_sms_sender(text, text) TO supabase_auth_admin;
        -- Grant usage on the public schema if not already granted
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.schema_privileges
                WHERE grantee = 'supabase_auth_admin'
                AND table_schema = 'public'
                AND privilege_type = 'USAGE'
            ) THEN
                GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
            END IF;
        END
        $$;

        -- 3. Register the hook in the Supabase Auth configuration
        UPDATE auth.settings SET hook_sms_provider = 'kavenegar_sms_sender';
    `;
    
    // We use the generic 'execute_sql' function which we will ensure exists first.
    const { error } = await supabase.rpc('execute_sql', { sql: sqlCommands });

    if (error) {
      console.error('CRITICAL ERROR setting up auth hook:', error);
      throw error;
    }
    
    // After setting the hook, we must trigger a config reload in the Auth service.
    // This is a crucial step that is often missed.
    console.log('Reloading Supabase Auth config to apply the new hook...');
    const configReloadResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/config`, {
        method: 'PUT',
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            hook_sms_provider: "kavenegar_sms_sender"
        })
    });

    if (!configReloadResponse.ok) {
        const errorBody = await configReloadResponse.text();
        console.error('Failed to reload auth config:', errorBody);
        throw new Error('Failed to reload Supabase auth config.');
    }

    console.log('✅ Successfully configured and reloaded custom SMS provider hook.');
}

async function createExecuteSqlFunction() {
    const { data, error } = await supabase.functions.invoke('execute-sql', {
        body: { 
            query: `
                CREATE OR REPLACE FUNCTION execute_sql(sql text)
                RETURNS void
                LANGUAGE plpgsql
                AS $$
                BEGIN
                    EXECUTE sql;
                END;
                $$;
            `
        }
    });

    // Check for function invocation error or error within the executed SQL
    if (error) {
        console.error('Failed to invoke execute-sql function', error);
        throw error;
    }
    if (data && data.error) {
         console.error('Failed to create helper function `execute_sql`', data.error);
        throw new Error(data.error);
    }
}


async function main() {
    try {
        console.log("Ensuring 'execute_sql' helper function exists...");
        // This function is now designed to be idempotent and safe to run multiple times.
        // The implementation details are abstracted into the Supabase Edge Function.
        await createExecuteSqlFunction();
        console.log("Setting up authentication hook...");
        await setupAuthHook();
        console.log('Database setup complete.');
    } catch(e) {
        console.error("An error occurred during database setup:", e);
        process.exit(1);
    }
}

main();
