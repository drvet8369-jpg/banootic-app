-- Add the last_activity_at column to the providers table with a default of now()
ALTER TABLE public.providers
ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing providers to ensure they are not unfairly penalized.
-- We'll set their last activity to their creation date.
UPDATE public.providers
SET last_activity_at = created_at
WHERE last_activity_at IS NULL;

-- Create an index on the new column for faster sorting, crucial for performance.
CREATE INDEX IF NOT EXISTS idx_providers_last_activity_at_desc ON public.providers (last_activity_at DESC NULLS LAST);
