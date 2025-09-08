-- Create a custom type for user roles to ensure data integrity
CREATE TYPE public.user_account_type AS ENUM ('customer', 'provider');

-- Create the users table to store basic information for all users
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    account_type public.user_account_type NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Add comments for clarity
COMMENT ON TABLE public.users IS 'Stores basic profile information for all users, linking to auth.users.';
COMMENT ON COLUMN public.users.id IS 'Links to auth.users.id';

-- Create the providers table for users who offer services
CREATE TABLE public.providers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    service text NOT NULL,
    location text NOT NULL,
    bio text NOT NULL,
    category_slug text NOT NULL,
    service_slug text NOT NULL,
    rating numeric(2, 1) NOT NULL DEFAULT 0.0,
    reviews_count integer NOT NULL DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Add comments for clarity
COMMENT ON TABLE public.providers IS 'Stores detailed information for service providers.';

-- Create the customers table for users who book services
CREATE TABLE public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Add comments for clarity
COMMENT ON TABLE public.customers IS 'Stores information for customers.';

-- Create the reviews table
CREATE TABLE public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_name text NOT NULL
);
-- Add comments for clarity
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for providers.';

-- Create the agreements table
CREATE TABLE public.agreements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_phone text NOT NULL,
    provider_phone text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone
);
-- Add comments for clarity
COMMENT ON TABLE public.agreements IS 'Tracks service agreements between customers and providers.';
