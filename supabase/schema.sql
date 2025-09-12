-- Create the 'categories' table
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text
);
-- Create the 'services' table
CREATE TABLE IF NOT EXISTS public.services (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    category_id bigint REFERENCES public.categories(id) ON DELETE CASCADE
);
-- Create the 'profiles' table
-- This table stores public user data.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type text NOT NULL CHECK (account_type IN ('customer', 'provider')),
    full_name text NOT NULL,
    phone text UNIQUE,
    -- Provider-specific fields
    service_description text,
    bio text,
    location text,
    category_id bigint REFERENCES public.categories(id),
    service_id bigint REFERENCES public.services(id),
    rating numeric(2, 1) DEFAULT 0.0,
    reviews_count integer DEFAULT 0,
    profile_image_url text,
    portfolio_urls text []
);
-- Create the 'reviews' table
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name text NOT NULL,
    rating integer NOT NULL CHECK (
        rating >= 1 AND rating <= 5
    ),
    comment text,
    created_at timestamptz DEFAULT now()
);
-- Create a table for one-time passwords (OTP)
CREATE TABLE IF NOT EXISTS public.one_time_passwords (
    phone text PRIMARY KEY,
    token text NOT NULL,
    created_at timestamptz DEFAULT now()
);
-- Create a function to update the user's phone in the profiles table
CREATE OR REPLACE FUNCTION public.handle_user_phone_update() RETURNS TRIGGER AS $$ BEGIN -- This trigger function is designed to run after a user's phone number is updated in the auth.users table.
-- It copies the new phone number to the public.profiles table to keep them in sync.
-- This is useful for displaying the user's phone number on their profile or in other parts of the application.
UPDATE public.profiles
SET phone = NEW.phone
WHERE id = NEW.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create a trigger to call the function when a user's phone is updated
CREATE TRIGGER on_user_phone_update
AFTER
UPDATE OF phone ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_user_phone_update();
-- Set up Row Level Security (RLS)
--
-- Enable RLS for all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_passwords ENABLE ROW LEVEL SECURITY;
-- Policies for 'categories' table
-- Allow anyone to read categories.
CREATE POLICY "Allow public read access to categories" ON public.categories FOR
SELECT USING (true);
-- Policies for 'services' table
-- Allow anyone to read services.
CREATE POLICY "Allow public read access to services" ON public.services FOR
SELECT USING (true);
-- Policies for 'profiles' table
-- 1. Allow anyone to view public profiles.
CREATE POLICY "Profiles are viewable by everyone." ON public.profiles FOR
SELECT USING (true);
-- 2. Allow users to update their own profile.
CREATE POLICY "Users can update their own profile." ON public.profiles FOR
UPDATE USING (auth.uid() = id);
-- Policies for 'reviews' table
-- 1. Allow anyone to view reviews.
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR
SELECT USING (true);
-- 2. Allow authenticated users to insert a review.
CREATE POLICY "Authenticated users can create reviews." ON public.reviews FOR INSERT
WITH
    CHECK (auth.role() = 'authenticated');
-- 3. Allow users to delete their own reviews.
CREATE POLICY "Users can delete their own reviews." ON public.reviews FOR DELETE USING (auth.uid() = author_id);
-- Policies for 'one_time_passwords' table
-- No one should be able to read OTPs directly. We will manage them with SECURITY DEFINER functions if needed.
-- For now, we rely on server-side admin access.
-- Full Text Search Setup
--
-- Create a single column 'fts' in the profiles table to store concatenated text for searching
ALTER TABLE public.profiles
ADD COLUMN fts tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'english',
            coalesce(full_name, '') || ' ' || coalesce(service_description, '') || ' ' || coalesce(bio, '')
        )
    ) STORED;
-- Create a GIN index on the new 'fts' column for fast searching
CREATE INDEX profiles_fts_idx ON public.profiles USING GIN (fts);