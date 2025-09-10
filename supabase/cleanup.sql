-- This script programmatically resets the database by dropping all tables
-- created during our development process. This prepares the database for
-- a clean installation using the main schema.sql file.

-- Dropping tables in reverse order of dependency is good practice,
-- but CASCADE makes it less critical. Using CASCADE to handle all dependencies.

DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.agreements CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
