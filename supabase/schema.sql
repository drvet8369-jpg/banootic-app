-- Banotik App Schema
-- Version 1.0.0
-- This script sets up the complete database structure from a clean slate.

-- Enable the uuid-ossp extension if not already enabled, for generating UUIDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create the public.users table to store basic user information.
-- This table is linked to auth.users via the user's UUID.
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE NOT NULL,
    account_type character varying NOT NULL CHECK (account_type IN ('customer', 'provider')),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Stores public-facing user information.';

-- Create the public.providers table for users who are service providers.
CREATE TABLE IF NOT EXISTS public.providers (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE NOT NULL,
    service character varying,
    location character varying,
    bio text,
    category_slug character varying,
    service_slug character varying,
    rating double precision DEFAULT 0 NOT NULL,
    reviews_count integer DEFAULT 0 NOT NULL,
    profile_image jsonb DEFAULT '{"src": "", "ai_hint": "woman portrait"}'::jsonb,
    portfolio jsonb[] DEFAULT ARRAY[]::jsonb[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.providers IS 'Stores detailed profiles for service providers.';

-- Create the public.customers table for users who are customers.
-- While less detailed, this maintains a consistent structure.
CREATE TABLE IF NOT EXISTS public.customers (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.customers IS 'Stores profile information for customers.';

-- Create the public.reviews table for customer reviews of providers.
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_name character varying NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for providers.';

-- Create the public.agreements table to track service agreements.
CREATE TABLE IF NOT EXISTS public.agreements (
    id bigserial PRIMARY KEY,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL CHECK (status IN ('pending', 'confirmed')),
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone
);
COMMENT ON TABLE public.agreements IS 'Tracks service agreements between customers and providers.';

-- Create the public.conversations table for the chat system.
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    participant_one_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_two_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_at timestamp with time zone,
    CONSTRAINT participants_unique UNIQUE (participant_one_id, participant_two_id)
);
COMMENT ON TABLE public.conversations IS 'Represents a chat thread between two users.';

-- Create the public.messages table for individual chat messages.
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.messages IS 'Stores individual messages within a conversation.';

-- Create policies for RLS (Row-Level Security)

-- USERS Table Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile and all other profiles." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PROVIDERS Table Policies
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view provider profiles." ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can insert their own profile." ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update their own profile." ON public.providers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CUSTOMERS Table Policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view customer profiles." ON public.customers FOR SELECT USING (true);
CREATE POLICY "Customers can insert their own profile." ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers can update their own profile." ON public.customers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REVIEWS Table Policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view reviews." ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews." ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AGREEMENTS Table Policies
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agreements." ON public.agreements FOR SELECT USING (
  (SELECT phone FROM public.users WHERE id = auth.uid()) = customer_phone OR
  (SELECT phone FROM public.users WHERE id = auth.uid()) = provider_phone
);
CREATE POLICY "Authenticated users can insert agreements." ON public.agreements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Providers can update their own agreements." ON public.agreements FOR UPDATE USING (
  (SELECT phone FROM public.users WHERE id = auth.uid()) = provider_phone
);

-- CONVERSATIONS Table Policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own conversations." ON public.conversations FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- MESSAGES Table Policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations." ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert messages in their conversations." ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark their received messages as read." ON public.messages FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- Create bucket for images if it doesn't exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for storage access.
CREATE POLICY "Allow public read access to images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow authenticated users to update their own images" ON storage.objects FOR UPDATE TO authenticated USING ((select auth.uid())::text = owner);
