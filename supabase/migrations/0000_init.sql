-- Create the agreements table with correct timestamp defaults
CREATE TABLE IF NOT EXISTS public.agreements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_phone TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- Can be 'pending', 'confirmed'
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(provider_phone, customer_phone)
);

-- Enable Row Level Security for the agreements table
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors on re-run
DROP POLICY IF EXISTS "Allow public read access" ON public.agreements;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.agreements;
DROP POLICY IF EXISTS "Allow providers to update their agreements" ON public.agreements;

-- Create policies for the agreements table
CREATE POLICY "Allow public read access" 
ON public.agreements FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert" 
ON public.agreements FOR INSERT TO authenticated WITH CHECK (true);

-- Note: This policy assumes you store the provider's phone in the auth.users.phone field.
-- If not, you'll need a way to join with a user profile table to verify ownership.
CREATE POLICY "Allow providers to update their agreements" 
ON public.agreements FOR UPDATE 
USING ((SELECT auth.jwt() ->> 'phone') = provider_phone);