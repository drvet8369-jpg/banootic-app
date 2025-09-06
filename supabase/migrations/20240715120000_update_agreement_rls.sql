
-- supabase/migrations/YYYYMMDDHHMMSS_update_agreement_rls.sql

-- Drop existing policies if they exist to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agreements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.agreements;
DROP POLICY IF EXISTS "Enable update for provider" ON public.agreements;

-- Enable Row Level Security on the table
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read any agreement.
-- This is generally safe as it doesn't contain highly sensitive personal data beyond phone numbers.
CREATE POLICY "Enable read access for all users"
ON public.agreements
FOR SELECT
USING (true);

-- Policy: Allow any authenticated user to create a request (agreement).
-- This lets customers initiate contact with providers.
CREATE POLICY "Enable insert for authenticated users"
ON public.agreements
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow only the specific provider involved in the agreement to update its status.
-- This is a critical security rule.
CREATE POLICY "Enable update for provider"
ON public.agreements
FOR UPDATE
USING (auth.jwt() ->> 'phone' = provider_phone)
WITH CHECK (auth.jwt() ->> 'phone' = provider_phone);
