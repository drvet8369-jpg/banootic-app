-- Enable the pgcrypto extension if it's not already enabled.
-- This provides access to functions like gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- Define a custom type for user account roles to ensure data integrity.
-- This is cleaner than using a CHECK constraint directly in the table.
CREATE TYPE public.user_account_type AS ENUM ('customer', 'provider');

-- Create the main 'users' table to store basic information for all users.
-- This table is linked to the authentication system via the 'id'.
CREATE TABLE public.users (
    id uuid PRIMARY KEY NOT NULL DEFAULT extensions.gen_random_uuid(),
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    account_type public.user_account_type NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create the 'providers' table for users who offer services.
-- It references the 'users' table and holds provider-specific details.
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
    rating real NOT NULL DEFAULT 0,
    reviews_count integer NOT NULL DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create the 'customers' table for users who consume services.
-- This can be extended later with customer-specific information.
CREATE TABLE public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create the 'reviews' table to store customer feedback for providers.
CREATE TABLE public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create the 'agreements' table to track service agreements between users.
CREATE TABLE public.agreements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_phone text NOT NULL,
    provider_phone text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    requested_at timestamp with time zone NOT NULL DEFAULT now(),
    confirmed_at timestamp with time zone
);
