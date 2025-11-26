
-- 1. Create Tables

-- Table for user profiles, linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ,
    full_name TEXT,
    account_type TEXT CHECK (account_type IN ('customer', 'provider'))
);

-- Table for service providers
CREATE TABLE IF NOT EXISTS public.providers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service TEXT NOT NULL,
    location TEXT,
    phone TEXT UNIQUE NOT NULL,
    bio TEXT,
    category_slug TEXT,
    service_slug TEXT,
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    profile_image JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for portfolio items
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id BIGINT REFERENCES public.providers(id) ON DELETE CASCADE,
    image_url TEXT,
    ai_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id BIGINT REFERENCES public.providers(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for one-time passwords
CREATE TABLE IF NOT EXISTS public.one_time_passwords (
    phone TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_passwords ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Providers are viewable by everyone." ON public.providers;
DROP POLICY IF EXISTS "Portfolio items are viewable by everyone." ON public.portfolio_items;
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
DROP POLICY IF EXISTS "OTPs can be managed by service_role only" ON public.one_time_passwords;
DROP POLICY IF EXISTS "Allow full access for service_role" ON public.providers;
DROP POLICY IF EXISTS "Allow full access for service_role" ON public.portfolio_items;
DROP POLICY IF EXISTS "Allow full access for service_role" ON public.reviews;


-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone."
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Providers policies
CREATE POLICY "Providers are viewable by everyone."
    ON public.providers FOR SELECT
    USING (true);

-- Portfolio items policies
CREATE POLICY "Portfolio items are viewable by everyone."
    ON public.portfolio_items FOR SELECT
    USING (true);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone."
    ON public.reviews FOR SELECT
    USING (true);

-- Allow authenticated users to insert reviews
CREATE POLICY "Authenticated users can insert reviews."
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- OTP table should be service_role only for security
CREATE POLICY "OTPs can be managed by service_role only"
    ON public.one_time_passwords FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Grant service_role full access to other tables for admin operations
CREATE POLICY "Allow full access for service_role on providers"
    ON public.providers FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow full access for service_role on portfolio"
    ON public.portfolio_items FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
    
CREATE POLICY "Allow full access for service_role on reviews"
    ON public.reviews FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

