--
-- Custom Script to configure Supabase Auth.
-- This script ensures the necessary configuration for using a custom SMS provider.
--

-- 1. Create the auth.config table if it doesn't exist.
-- This table is crucial for storing authentication settings.
CREATE TABLE IF NOT EXISTS auth.config (
    key character varying(255) NOT NULL PRIMARY KEY,
    value character varying(255)
);

-- 2. Insert or Update the configuration for the external phone provider.
-- This tells Supabase Auth to use our custom Edge Function for sending OTPs.
-- The 'ON CONFLICT' clause makes this script safe to run multiple times.
INSERT INTO auth.config (key, value)
VALUES ('external_phone_provider', 'kavenegar-otp-sender')
ON CONFLICT (key)
DO UPDATE SET value = 'kavenegar-otp-sender';

-- Grant necessary permissions to the supabase_auth_admin role
GRANT ALL ON TABLE auth.config TO supabase_auth_admin;
GRANT ALL ON TABLE auth.config TO dashboard_user;
GRANT ALL ON TABLE auth.config TO postgres;
