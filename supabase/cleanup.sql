-- This script is designed to be run before schema.sql to ensure a clean slate.
-- It drops tables and functions that are managed by this project.
-- The "IF EXISTS" clause prevents errors if the objects don't exist.

-- Drop Tables in reverse order of dependency
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.one_time_passwords;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.categories;

-- Drop Functions
DROP FUNCTION IF EXISTS public.search_providers(search_term text);
DROP FUNCTION IF EXISTS public.get_provider_details(p_phone text);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop Types (if any custom types were created)
-- e.g., DROP TYPE IF EXISTS public.account_type;

