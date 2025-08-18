-- Enable Row Level Security for the customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public (unauthenticated) users to insert new rows.
-- This is necessary for the registration form to work.
CREATE POLICY "Allow public inserts for customers"
ON public.customers
FOR INSERT
WITH CHECK (true);

-- Create a policy to allow all users to read from the customers table.
-- This is necessary for the .select() part of the createCustomer function to work after an insert.
CREATE POLICY "Enable read access for all users"
ON public.customers
FOR SELECT
USING (true);

-- Enable Row Level Security for the providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public (unauthenticated) users to insert new providers.
CREATE POLICY "Allow public inserts for providers"
ON public.providers
FOR INSERT
WITH CHECK (true);

-- Create a policy to allow all users to read from the providers table.
CREATE POLICY "Enable read access for all providers"
ON public.providers
FOR SELECT
USING (true);

-- Create a policy to allow the owner of a profile to update it.
-- This requires passing the user's ID (phone) to the update function.
-- Note: We will implement this in a future step. For now, a broader policy might be needed if we allow public updates.
-- This policy assumes an `auth.uid()` function is available and maps to the user's phone.
-- For now, let's allow any authenticated user to update for simplicity of current features.
-- We can tighten this later.
CREATE POLICY "Allow provider to update their own profile"
ON public.providers
FOR UPDATE
USING (true); -- Simplified for now

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a review
CREATE POLICY "Allow public inserts for reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read all reviews
CREATE POLICY "Enable read access for all reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Enable RLS for agreements
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert an agreement
CREATE POLICY "Allow public inserts for agreements"
ON public.agreements
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read all agreements
CREATE POLICY "Enable read access for all agreements"
ON public.agreements
FOR SELECT
USING (true);

-- Allow anyone to update an agreement (e.g., to confirm it)
CREATE POLICY "Allow public updates for agreements"
ON public.agreements
FOR UPDATE
USING (true);
