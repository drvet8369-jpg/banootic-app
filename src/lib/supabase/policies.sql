
-- Enable RLS for all tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.providers;
DROP POLICY IF EXISTS "Enable update for users based on phone" ON public.providers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.reviews;
DROP POLICY IF EXISTS "Enable read for provider" ON public.agreements;
DROP POLICY IF EXISTS "Enable read for customer" ON public.agreements;
DROP POLICY IF EXISTS "Enable insert for customer" ON public.agreements;
DROP POLICY IF EXISTS "Enable update for provider" ON public.agreements;

-- Policies for 'providers' table
CREATE POLICY "Enable read access for all users" ON public.providers
FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on phone" ON public.providers
FOR UPDATE USING (auth.jwt() ->> 'phone' = phone) WITH CHECK (auth.jwt() ->> 'phone' = phone);


-- Policies for 'customers' table
CREATE POLICY "Enable insert for authenticated users only" ON public.customers
FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for 'reviews' table
CREATE POLICY "Enable read access for all users" ON public.reviews
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.reviews
FOR INSERT TO authenticated WITH CHECK (true);


-- Policies for 'agreements' table
CREATE POLICY "Enable read for provider" ON public.agreements
FOR SELECT USING (auth.jwt() ->> 'phone' = provider_phone);

CREATE POLICY "Enable read for customer" ON public.agreements
FOR SELECT USING (auth.jwt() ->> 'phone' = customer_phone);

CREATE POLICY "Enable insert for customer" ON public.agreements
FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'phone' = customer_phone);

CREATE POLICY "Enable update for provider" ON public.agreements
FOR UPDATE USING (auth.jwt() ->> 'phone' = provider_phone) WITH CHECK (auth.jwt() ->> 'phone' = provider_phone);


-- Policies for 'images' bucket in Storage
-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own images" ON storage.objects;


CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow authenticated users to update their own images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'images' AND auth.uid() = owner);

CREATE POLICY "Allow authenticated users to delete their own images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'images' AND auth.uid() = owner);
