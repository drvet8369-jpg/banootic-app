-- Initial Schema Setup

-- 1. Users Table
-- Stores public user information, linked to auth.users.
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying UNIQUE,
    account_type character varying,
    created_at timestamp with time zone DEFAULT now(),
    profile_image jsonb
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Providers Table
-- Stores detailed information for users who are service providers.
CREATE TABLE IF NOT EXISTS public.providers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying UNIQUE,
    service character varying,
    location character varying,
    bio text,
    category_slug character varying,
    service_slug character varying,
    rating double precision DEFAULT 0,
    reviews_count integer DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 3. Customers Table
-- Stores information for users who are customers.
CREATE TABLE IF NOT EXISTS public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 4. Reviews Table
-- Stores reviews given by customers to providers.
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_name character varying,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. Agreements Table
-- Tracks service agreements between customers and providers.
CREATE TABLE IF NOT EXISTS public.agreements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status character varying DEFAULT 'pending',
    requested_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone
);
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;


-- 6. RLS Policies
-- Define security rules for data access.

-- Policies for USERS table
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for PROVIDERS table
CREATE POLICY "Public can view all providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Policies for CUSTOMERS table
CREATE POLICY "Users can view their own customer entry" ON public.customers FOR SELECT USING (auth.uid() = user_id);

-- Policies for REVIEWS table
CREATE POLICY "Public can view all reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for AGREEMENTS table
CREATE POLICY "Users can view their own agreements" ON public.agreements FOR SELECT USING (((SELECT auth.jwt()->>'phone'::text) = customer_phone) OR ((SELECT auth.jwt()->>'phone'::text) = provider_phone));
CREATE POLICY "Customers can create agreements for themselves" ON public.agreements FOR INSERT WITH CHECK (((SELECT auth.jwt()->>'phone'::text) = customer_phone));
CREATE POLICY "Allow providers to update their own agreements" ON public.agreements FOR UPDATE USING ((SELECT auth.jwt()->>'phone'::text) = provider_phone);


-- 7. Storage Buckets
-- Configure file storage for images.

-- Create a bucket for 'images' if it doesn't exist, and make it public.
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS policies for 'images' bucket.
CREATE POLICY "Allow public read access to images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Allow owners to update their images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.uid() = owner);
CREATE POLICY "Allow owners to delete their images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.uid() = owner);


-- 8. Database Functions
-- Recreate the function to update provider rating upon new review.
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.providers
  SET
    reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE provider_id = NEW.provider_id),
    rating = (SELECT AVG(rating) FROM public.reviews WHERE provider_id = NEW.provider_id)
  WHERE
    id = NEW.provider_id;
  RETURN NEW;
END;
$$;

-- 9. Triggers
-- Drop the existing trigger if it's there, then create it.
DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
CREATE TRIGGER on_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_provider_rating();

-- 10. Handle user creation in public schema
-- This function syncs new users from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This is important!
AS $$
BEGIN
  INSERT INTO public.users (id, name, phone, account_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'account_type'
  );
  
  -- If the new user is a provider, also create an entry in the providers table
  IF NEW.raw_user_meta_data->>'account_type' = 'provider' THEN
    INSERT INTO public.providers (user_id, name, phone, service, bio, category_slug, service_slug, location)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'service',
      NEW.raw_user_meta_data->>'bio',
      NEW.raw_user_meta_data->>'category_slug',
      NEW.raw_user_meta_data->>'service_slug',
      NEW.raw_user_meta_data->>'location'
    );
  END IF;
  
  -- If the new user is a customer, create an entry in the customers table
  IF NEW.raw_user_meta_data->>'account_type' = 'customer' THEN
    INSERT INTO public.customers (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop the existing trigger if it's there, then create it.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
