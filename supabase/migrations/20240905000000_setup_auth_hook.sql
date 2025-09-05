-- supabase/migrations/20240905000000_setup_auth_hook.sql

-- Enable the plv8 extension if it's not already enabled.
-- This allows us to use JavaScript for database functions.
create extension if not exists plv8;

-- Create or replace the function that will call our Kavenegar Edge Function.
-- This function is called by Supabase Auth every time it needs to send an OTP.
create or replace function public.kavenegar_sms_sender(phone text, token text)
returns json
language plv8
as $$
  // Get the Supabase URL and Service Role Key from environment variables
  // These are securely available inside the database environment.
  const supabase_url = plv8.execute("SELECT current_setting('app.supabase.url')")[0].current_setting;
  const service_role_key = plv8.execute("SELECT current_setting('app.supabase.service_role_key')")[0].current_setting;
  const kavenegar_function_uri = `${supabase_url}/functions/v1/kavenegar-otp-sender`;

  // Make a POST request to our Edge Function
  const response = plv8.execute(
      `SELECT content FROM http_post(
          '${kavenegar_function_uri}',
          json_build_object(
              'phone', phone,
              'data', json_build_object('token', token)
          )::text,
          'application/json',
          json_build_object(
              'Authorization', 'Bearer ' || service_role_key
          )::text
      )`
  );
  
  return response[0].content;
$$;

-- Grant usage permission to the necessary roles so Auth can use the function.
grant execute on function public.kavenegar_sms_sender(text, text) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;

-- This is the final step: it tells the Supabase Auth system to use our custom function.
-- We use a transaction to handle potential race conditions.
begin;
  -- Lock the settings table to prevent concurrent writes
  lock table auth.settings in exclusive mode;
  -- Update the setting to register our custom SMS provider hook
  update auth.settings set hook_sms_provider = 'kavenegar_sms_sender';
commit;
