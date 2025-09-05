// This is a helper script to apply SQL changes to the database.
// It reads all .sql files from the current directory and executes them.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createAdminClient } from './server';
import fs from 'fs/promises';
import path from 'path';

const supabase = createAdminClient();

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
                        ''application/json''
                    )'
                );
                
                -- Supabase Auth expects a JSON object to be returned, even if it's empty.
                -- We return the content from the Edge Function response.
                return response[0].content;
            $$;

            -- 2. Grant usage permission to the necessary roles
            grant execute on function public.kavenegar_sms_sender(text, text) to supabase_auth_admin;
            grant usage on schema public to supabase_auth_admin;

            -- 3. Register the hook in the Supabase Auth configuration
            -- This tells Supabase Auth to use our function for sending OTPs.
            UPDATE auth.settings SET hook_sms_provider = 'kavenegar_sms_sender';

            -- 4. Re-load the configuration so the changes take effect immediately
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

// Helper function in the DB to run arbitrary SQL
const createExecuteSqlFn = async () => {
    const { error } = await supabase.rpc('execute_sql', {
        sql: `
            create or replace function execute_sql(sql text)
            returns void
            language plpgsql
            as $$
            begin
                execute sql;
            end;
            $$;
        `,
    });
    if (error && error.code !== '42723') { // 42723 is duplicate_function
        console.error('Failed to create helper function `execute_sql`', error);
        throw error;
    }
}

async function main() {
    await createExecuteSqlFn();
    await setupAuthHook();
    console.log('Database setup complete.');
}

main().catch(console.error);