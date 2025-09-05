
// This is a helper script to apply SQL changes to the database.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createAdminClient } from './admin';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not set.");
    process.exit(1);
}

const supabase = createAdminClient();

// This function creates the necessary hook to link our Kavenegar function to Supabase Auth.
async function setupAuthHook() {
    console.log('Setting up Supabase auth hook for custom SMS provider...');

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
        GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

        -- 3. Register the hook in the Supabase Auth configuration
        UPDATE auth.settings SET hook_sms_provider = 'kavenegar_sms_sender';
    `;
    
    // The correct way to execute raw SQL using the admin client is via rpc call to a generic function
    // that can execute any query. Let's create that function first if it doesn't exist.
    const enablePlv8Extension = `CREATE EXTENSION IF NOT EXISTS plv8;`;
    const { error: extError } = await supabase.rpc('execute_raw_sql', { query: enablePlv8Extension });
     if (extError) {
      console.error('CRITICAL ERROR enabling plv8 extension:', extError);
      throw extError;
    }


    const { error } = await supabase.rpc('execute_raw_sql', { query: sqlCommands });

    if (error) {
      console.error('CRITICAL ERROR setting up auth hook:', error);
      throw error;
    }
    
    console.log('✅ Successfully ran setup SQL for custom SMS provider hook.');
}

async function main() {
    try {
        console.log("Setting up authentication hook...");
        await setupAuthHook();
        
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

        console.log('✅ Auth config reloaded successfully.');
        console.log('Database setup complete.');

    } catch(e) {
        console.error("An error occurred during database setup:", e);
        process.exit(1);
    }
}

main();
