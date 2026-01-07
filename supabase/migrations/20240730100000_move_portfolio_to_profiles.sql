
-- Drop the misplaced portfolio column from the providers table if it exists
ALTER TABLE public.providers
DROP COLUMN IF EXISTS portfolio;

-- Add the portfolio column to the profiles table if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS portfolio jsonb;
