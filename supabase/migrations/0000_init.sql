
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow providers to update their agreements" ON public.agreements;
DROP POLICY IF EXISTS "Users can view their own agreements" ON public.agreements;
DROP POLICY IF EXISTS "Customers can create agreements" ON public.agreements;

-- Drop existing tables and types if they exist, in reverse order of creation
DROP TABLE IF EXISTS public.agreements;
DROP TYPE IF EXISTS public.agreement_status;

-- Create a custom type for agreement status
CREATE TYPE public.agreement_status AS ENUM (
    'pending',
    'confirmed'
);

-- Create the agreements table with the correct schema
CREATE TABLE public.agreements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status public.agreement_status DEFAULT 'pending'::public.agreement_status NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone
);

-- Enable Row Level Security on the table
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Create policies for row-level security
-- 1. Policy for creating agreements: Any logged-in user can create an agreement.
CREATE POLICY "Customers can create agreements"
ON public.agreements FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 2. Policy for viewing agreements: A user can see an agreement if they are either the customer or the provider.
CREATE POLICY "Users can view their own agreements"
ON public.agreements FOR SELECT
USING (
  (SELECT auth.jwt()->>'phone')::text = customer_phone OR
  (SELECT auth.jwt()->>'phone')::text = provider_phone
);

-- 3. Policy for updating agreements: A provider can update (confirm) an agreement if it's their agreement.
CREATE POLICY "Allow providers to update their agreements"
ON public.agreements FOR UPDATE
USING ((SELECT auth.jwt()->>'phone')::text = provider_phone)
WITH CHECK ((SELECT auth.jwt()->>'phone')::text = provider_phone);

