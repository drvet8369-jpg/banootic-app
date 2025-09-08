
-- Step 1: Enable the pgcrypto extension to use gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Step 2: Define a custom type for user account roles
CREATE TYPE public.user_account_type AS ENUM (
    'customer',
    'provider'
);

-- Step 3: Create the main users table
CREATE TABLE public.users (
    id uuid PRIMARY KEY NOT NULL DEFAULT extensions.gen_random_uuid(),
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    account_type public.user_account_type NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 4: Create the providers table with a foreign key to users
CREATE TABLE public.providers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    service text NOT NULL,
    location text NOT NULL DEFAULT 'ارومیه',
    bio text NOT NULL,
    category_slug text NOT NULL,
    service_slug text NOT NULL,
    rating real NOT NULL DEFAULT 0,
    reviews_count integer NOT NULL DEFAULT 0,
    profile_image jsonb NOT NULL DEFAULT '{}'::jsonb,
    portfolio jsonb[] NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 5: Create the customers table (if needed for specific customer data)
CREATE TABLE public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 6: Create the reviews table
CREATE TABLE public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    customer_name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 7: Create the agreements table
CREATE TABLE public.agreements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_phone text NOT NULL,
    provider_phone text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    requested_at timestamp with time zone NOT NULL DEFAULT now(),
    confirmed_at timestamp with time zone
);

-- Step 8: Setup Real-time for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements, public.reviews, public.providers, public.users, public.customers;
