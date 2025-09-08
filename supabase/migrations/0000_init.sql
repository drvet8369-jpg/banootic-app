
-- Enable the pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Create a custom type for user roles
CREATE TYPE public.user_account_type AS ENUM ('provider', 'customer');

-- Create the users table
-- This table holds common information for all users, linking to auth.users.
CREATE TABLE public.users (
    id uuid PRIMARY KEY NOT NULL DEFAULT extensions.gen_random_uuid(),
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    account_type public.user_account_type NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create the providers table
-- This table holds specific information for users who are service providers.
CREATE TABLE public.providers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text NOT NULL,
    service text NOT NULL,
    location text NOT NULL,
    bio text NOT NULL,
    category_slug text NOT NULL,
    service_slug text NOT NULL,
    rating real NOT NULL DEFAULT 0,
    reviews_count integer NOT NULL DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb[],
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create the customers table
-- This table holds specific information for users who are customers.
CREATE TABLE public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create the reviews table
CREATE TABLE public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    customer_name text
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create the agreements table
CREATE TABLE public.agreements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_phone text NOT NULL,
    provider_phone text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    requested_at timestamp with time zone NOT NULL DEFAULT now(),
    confirmed_at timestamp with time zone
);
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Add policies for RLS
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow individual read access to users" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow authenticated users to create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Allow authenticated users to create agreements" ON public.agreements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow provider to read their agreements" ON public.agreements FOR SELECT USING (provider_phone IN (SELECT phone FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Allow customer to read their agreements" ON public.agreements FOR SELECT USING (customer_phone IN (SELECT phone FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Allow provider to update their agreements" ON public.agreements FOR UPDATE USING (provider_phone IN (SELECT phone FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Allow provider to update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow user to update their own user info" ON public.users FOR UPDATE USING (auth.uid() = id);
