-- Enable Row Level Security if not already enabled
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access to all provider profiles.
-- This is necessary for anyone to be able to view a provider's public profile page.
-- The policy is read-only (SELECT), so it's secure.
CREATE POLICY "Enable public read access for all providers"
ON public.providers
FOR SELECT
USING (true);
