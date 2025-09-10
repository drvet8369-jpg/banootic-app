
-- This script safely drops existing tables and sequences to ensure a clean slate.
-- Using "IF EXISTS" prevents errors if the objects don't exist.
-- The order of dropping tables is important due to foreign key dependencies.

-- Drop dependent tables first
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.agreements;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.conversations;

-- Drop primary tables
DROP TABLE IF EXISTS public.providers;
DROP TABLE IF EXISTS public.customers;

-- Finally, drop the users table which others depend on
DROP TABLE IF EXISTS public.users;

-- Drop any sequences that might have been created in previous failed attempts
DROP SEQUENCE IF EXISTS public.providers_id_seq;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP SEQUENCE IF EXISTS public.reviews_id_seq;
DROP SEQUENCE IF EXISTS public.agreements_id_seq;
