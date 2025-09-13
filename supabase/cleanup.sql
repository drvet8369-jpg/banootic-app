-- This script should be run BEFORE schema.sql to ensure a clean slate.
-- It drops tables, policies, and functions in the correct order to avoid dependency errors.

-- Drop Policies first, as they depend on tables.
-- Note: Replace 'public' with your schema name if it's different.

DROP POLICY IF EXISTS "Allow public read access to categories" ON "public"."categories";
DROP POLICY IF EXISTS "Allow public read access to services" ON "public"."services";
DROP POLICY IF EXISTS "Allow public read access to profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow public read access to reviews" ON "public"."reviews";
DROP POLICY IF EXISTS "Users can insert their own reviews" ON "public"."reviews";
DROP POLICY IF EXISTS "Users can update their own reviews" ON "public"."reviews";
DROP POLICY IF EXISTS "Users can delete their own reviews" ON "public"."reviews";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";


-- Drop Tables. It's often safer to drop them in reverse order of creation.
DROP TABLE IF EXISTS "public"."reviews";
DROP TABLE IF EXISTS "public"."profiles";
DROP TABLE IF EXISTS "public"."services";
DROP TABLE IF EXISTS "public"."categories";
DROP TABLE IF EXISTS "public"."one_time_passwords";


-- Drop Functions
DROP FUNCTION IF EXISTS "public"."search_providers";
DROP FUNCTION IF EXISTS "public"."get_providers_by_service";
DROP FUNCTION IF EXISTS "public"."get_provider_details";
DROP FUNCTION IF EXISTS "public"."handle_new_user";

-- Drop Types if you have any custom types
-- e.g., DROP TYPE IF EXISTS public.user_role;
