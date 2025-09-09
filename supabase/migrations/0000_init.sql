
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    account_type TEXT NOT NULL CHECK (account_type IN ('customer', 'provider')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    service TEXT NOT NULL,
    location TEXT NOT NULL,
    bio TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    service_slug TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 0,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    customer_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    participant_one_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_two_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(participant_one_id, participant_two_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_phone TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(provider_phone, customer_phone)
);


-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policies for users
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for providers
DROP POLICY IF EXISTS "Allow public read access to providers" ON public.providers;
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow providers to update their own profile" ON public.providers;
CREATE POLICY "Allow providers to update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Policies for reviews
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert reviews" ON public.reviews;
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- Policies for agreements
DROP POLICY IF EXISTS "Allow public read access to agreements" ON public.agreements;
CREATE POLICY "Allow public read access to agreements" ON public.agreements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert agreements" ON public.agreements;
CREATE POLICY "Allow authenticated users to insert agreements" ON public.agreements FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow providers to update their agreements" ON public.agreements;
CREATE POLICY "Allow providers to update their agreements" ON public.agreements FOR UPDATE USING ((SELECT auth.jwt()->>'phone') = provider_phone);

-- Policies for conversations
DROP POLICY IF EXISTS "Users can only see their own conversations" ON public.conversations;
CREATE POLICY "Users can only see their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- Policies for messages
DROP POLICY IF EXISTS "Users can only see messages in their conversations" ON public.messages;
CREATE POLICY "Users can only see messages in their conversations" ON public.messages FOR SELECT USING (
    conversation_id IN (
        SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
    )
);

DROP POLICY IF EXISTS "Users can only send messages in their conversations" ON public.messages;
CREATE POLICY "Users can only send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
        SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
    )
);
