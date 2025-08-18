
-- Enable RLS for all relevant tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for providers" ON public.providers;
DROP POLICY IF EXISTS "Public read access for customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON public.customers;
DROP POLICY IF EXISTS "Public read access for reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated users to insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public read access for agreements" ON public.agreements;
DROP POLICY IF EXISTS "Allow authenticated users to insert agreements" ON public.agreements;
DROP POLICY IF EXISTS "Allow providers to update their own agreements" ON public.agreements;
DROP POLICY IF EXISTS "Allow authenticated users to insert providers" ON public.providers;
DROP POLICY IF EXISTS "Allow providers to update their own profile" ON public.providers;


-- Policies for 'providers' table
CREATE POLICY "Public read access for providers" ON public.providers
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert providers" ON public.providers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow providers to update their own profile" ON public.providers
  FOR UPDATE USING (auth.jwt() ->> 'phone' = phone)
  WITH CHECK (auth.jwt() ->> 'phone' = phone);

-- Policies for 'customers' table
CREATE POLICY "Public read access for customers" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert customers" ON public.customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for 'reviews' table
CREATE POLICY "Public read access for reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for 'agreements' table
CREATE POLICY "Public read access for agreements" ON public.agreements
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert agreements" ON public.agreements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow providers to update their own agreements" ON public.agreements
  FOR UPDATE USING (auth.jwt() ->> 'phone' = "providerPhone")
  WITH CHECK (auth.jwt() ->> 'phone' = "providerPhone");
