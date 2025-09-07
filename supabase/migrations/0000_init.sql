-- supabase/migrations/0000_init.sql

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    account_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create the providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT,
    location TEXT,
    bio TEXT,
    category_slug TEXT,
    service_slug TEXT,
    rating REAL DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    customer_name TEXT NOT NULL
);

-- Create RLS policies for tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow individual user to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for providers table
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Allow provider to update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Policies for customers table
CREATE POLICY "Allow individual access to their own customer record" ON public.customers FOR SELECT USING (auth.uid() = user_id);

-- Policies for reviews table
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
