-- Add a new column to the providers table to track recent activity.
-- This will be used as the primary sorting factor to promote active providers.
ALTER TABLE public.providers
ADD COLUMN last_activity_at TIMESTAMPTZ NULL;
