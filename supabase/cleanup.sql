-- cleanup.sql
-- This script drops all tables, types, and functions created by schema.sql
-- It's useful for a clean reset of the database.

-- Drop policies first to avoid dependency errors
DROP POLICY IF EXISTS "Allow public read-only access" ON "public"."categories";
DROP POLICY IF EXISTS "Allow public read-only access" ON "public"."services";
DROP POLICY IF EXISTS "Allow public read-only access" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow read access for all users" ON "public"."reviews";
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "public"."reviews";
DROP POLICY IF EXISTS "Allow delete for owners" ON "public"."reviews";
DROP POLICY IF EXISTS "Allow update for owners" ON "public"."reviews";
DROP POLICY IF EXISTS "Allow all access for admin users" ON "public"."one_time_passwords";

-- Disable RLS on tables before dropping them
ALTER TABLE IF EXISTS "public"."categories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."services" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."profiles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."reviews" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."one_time_passwords" DISABLE ROW LEVEL SECURITY;

-- Drop functions
DROP FUNCTION IF EXISTS "public"."handle_new_user";
DROP FUNCTION IF EXISTS "public"."get_providers_in_service";
DROP FUNCTION IF EXISTS "public"."search_providers";

-- Drop tables, using CASCADE to also drop dependent objects like foreign key constraints.
-- The order is important: drop tables that are referenced by others first.
DROP TABLE IF EXISTS "public"."reviews";
DROP TABLE IF EXISTS "public"."profiles";
DROP TABLE IF EXISTS "public"."services";
DROP TABLE IF EXISTS "public"."categories";
DROP TABLE IF EXISTS "public"."one_time_passwords";

-- Drop custom types
DROP TYPE IF EXISTS "public"."account_type";
