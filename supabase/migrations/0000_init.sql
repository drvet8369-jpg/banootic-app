-- Initial Schema Setup

-- Create the users table to store public-facing user information
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT UNIQUE,
    account_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.users IS 'Public profiles for all users, extending auth.users.';

-- Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customers IS 'Stores customer-specific data, linked to the users table.';

-- Create the providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT UNIQUE,
    service TEXT,
    location TEXT,
    bio TEXT,
    category_slug TEXT,
    service_slug TEXT,
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.providers IS 'Stores provider-specific data, including their professional details and portfolio.';

-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_name TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.reviews IS 'Stores reviews and ratings given by customers to providers.';

-- Create the agreements table with corrected defaults
CREATE TABLE IF NOT EXISTS public.agreements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_phone TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(provider_phone, customer_phone)
);
COMMENT ON TABLE public.agreements IS 'Tracks service agreements between customers and providers.';

-- Create the conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    participant_one_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_two_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    UNIQUE(participant_one_id, participant_two_id)
);
COMMENT ON TABLE public.conversations IS 'Represents a chat thread between two users.';

-- Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.messages IS 'Stores individual chat messages within a conversation.';

-- Enable Row Level Security for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for public.users table
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;
CREATE POLICY "Allow users to insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for public.providers table
DROP POLICY IF EXISTS "Allow public read access to providers" ON public.providers;
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow providers to manage their own profile" ON public.providers;
CREATE POLICY "Allow providers to manage their own profile" ON public.providers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for public.reviews table
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow customers to insert reviews" ON public.reviews;
CREATE POLICY "Allow customers to insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Policies for public.agreements table
DROP POLICY IF EXISTS "Allow public read access" ON public.agreements;
CREATE POLICY "Allow public read access" ON public.agreements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.agreements;
CREATE POLICY "Allow authenticated users to insert" ON public.agreements FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow providers to update their agreements" ON public.agreements;
CREATE POLICY "Allow providers to update their agreements" ON public.agreements FOR UPDATE USING (auth.jwt() ->> 'phone' = provider_phone) WITH CHECK (auth.jwt() ->> 'phone' = provider_phone);

-- Policies for public.conversations table
DROP POLICY IF EXISTS "Allow participants to access their conversations" ON public.conversations;
CREATE POLICY "Allow participants to access their conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- Policies for public.messages table
DROP POLICY IF EXISTS "Allow participants to access messages in their conversations" ON public.messages;
CREATE POLICY "Allow participants to access messages in their conversations" ON public.messages FOR SELECT USING (
    conversation_id IN (
        SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
    )
);
DROP POLICY IF EXISTS "Allow users to send messages in their conversations" ON public.messages;
CREATE POLICY "Allow users to send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
        SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
    )
);
