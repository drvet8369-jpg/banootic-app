-- supabase/migrations/0002_drop_agreements.sql

-- Drop the existing agreements table to remove any corrupted or problematic metadata.
DROP TABLE IF EXISTS public.agreements;
