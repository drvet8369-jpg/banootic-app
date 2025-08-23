-- This script contains the necessary Row Level Security (RLS) policies
-- for both the database tables and the storage buckets.
-- Execute this script in your Supabase SQL Editor to apply the security rules.

-- ====================================================================
-- === 1. DATABASE TABLE POLICIES =====================================
-- ====================================================================

-- --- PROVIDERS TABLE ---
-- Enable RLS for the providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
-- Allow public read access to all providers
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);
-- Allow a provider to update their own profile
CREATE POLICY "Allow provider to update their own profile" ON public.providers FOR UPDATE USING (auth.jwt() ->> 'phone' = phone) WITH CHECK (auth.jwt() ->> 'phone' = phone);


-- --- CUSTOMERS TABLE ---
-- Enable RLS for the customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- Allow a customer to view and update their own profile
CREATE POLICY "Allow customer to view and update their own profile" ON public.customers FOR ALL USING (auth.jwt() ->> 'phone' = phone) WITH CHECK (auth.jwt() ->> 'phone' = phone);


-- --- REVIEWS TABLE ---
-- Enable RLS for the reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
-- Allow public read access to all reviews
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
-- Allow authenticated users to insert a review
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);


-- --- AGREEMENTS TABLE ---
-- Enable RLS for the agreements table
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
-- Allow users to see agreements they are part of (either as customer or provider)
CREATE POLICY "Allow access to own agreements" ON public.agreements FOR SELECT USING (auth.jwt() ->> 'phone' = customer_phone OR auth.jwt() ->> 'phone' = provider_phone);
-- Allow authenticated users (customers) to create agreements
CREATE POLICY "Allow authenticated users to create agreements" ON public.agreements FOR INSERT TO authenticated WITH CHECK (true);
-- Allow provider to update the status of their agreement
CREATE POLICY "Allow provider to update their own agreement" ON public.agreements FOR UPDATE USING (auth.jwt() ->> 'phone' = provider_phone) WITH CHECK (auth.jwt() ->> 'phone' = provider_phone);


-- ====================================================================
-- === 2. STORAGE BUCKET POLICIES (IMAGES) ============================
-- ====================================================================
-- These policies control who can upload, view, update, and delete files in your 'images' bucket.

-- Drop existing policies on storage.objects if they exist to avoid conflicts.
-- It's safer to drop and recreate than to try and alter them.
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete their own images" ON storage.objects;


-- Enable RLS on the 'images' bucket via the underlying 'objects' table
-- This command is safe to run multiple times.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Allow public read access to all images in the bucket
CREATE POLICY "Allow public read access to images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'images' );

-- 2. Allow authenticated (logged-in) users to upload images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- 3. Allow the owner of an image to update it
CREATE POLICY "Allow owner to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'images' AND auth.uid() = owner );

-- 4. Allow the owner of an image to delete it
CREATE POLICY "Allow owner to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'images' AND auth.uid() = owner );

-- Note: The `owner` of an object in Supabase Storage is the `uuid` of the user
-- who uploaded it. The `auth.uid()` function retrieves the `uuid` of the
-- currently authenticated user making the request. This is how we ensure
- - users can only manage their own files.
