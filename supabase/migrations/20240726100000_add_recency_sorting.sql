-- This script adds the 'last_activity_at' column to the 'providers' table
-- and creates an index to optimize sorting by recency.

-- Step 1: Add the new column to store the timestamp of the last activity.
ALTER TABLE public.providers
ADD COLUMN last_activity_at TIMESTAMPTZ;

-- Step 2: Create an index to make sorting by this new column fast.
-- The 'DESC NULLS LAST' clause is crucial:
-- It sorts providers with recent activity to the top (DESC)
-- and places those with no activity yet (NULL) at the bottom.
CREATE INDEX IF NOT EXISTS idx_providers_last_activity_at ON public.providers (last_activity_at DESC NULLS LAST);
