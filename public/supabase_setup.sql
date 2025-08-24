-- This script is designed to be idempotent. You can run it multiple times without causing errors.

-- Drop dependent objects first
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid);
DROP POLICY IF EXISTS "Enable read access for all users" ON public.providers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own agreements" ON public.agreements;
DROP POLICY IF EXISTS "Users can view their own agreements" ON public.agreements;
DROP POLICY IF EXISTS "Providers can update their own agreements" ON public.agreements;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;


-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.agreements;
DROP TABLE IF EXISTS public.providers;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.users;


-- 1. Users Table
-- This table holds the core user information and is the parent for providers and customers.
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    account_type TEXT NOT NULL CHECK (account_type IN ('customer', 'provider'))
);
COMMENT ON TABLE public.users IS 'Stores basic user information, common to both customers and providers.';


-- 2. Providers Table
-- Stores profiles for service providers, linked to the users table.
CREATE TABLE public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    service TEXT NOT NULL,
    location TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    bio TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    service_slug TEXT NOT NULL,
    rating NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    reviews_count INT NOT NULL DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB[]
);
COMMENT ON TABLE public.providers IS 'Service provider profiles.';


-- 3. Customers Table
-- Stores profiles for customers, linked to the users table.
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE
);
COMMENT ON TABLE public.customers IS 'Customer profiles.';


-- 4. Reviews Table
-- Stores reviews left by users for providers.
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    author_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for providers.';


-- 5. Agreements Table
-- Tracks service agreements between customers and providers.
CREATE TABLE public.agreements (
    id BIGSERIAL PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider_phone TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE (provider_id, customer_id)
);
COMMENT ON TABLE public.agreements IS 'Tracks agreements between customers and providers.';


-- 6. Messages Table
-- Stores chat messages between users.
CREATE TABLE public.messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.messages IS 'Stores chat messages between users.';
CREATE INDEX messages_chat_id_idx ON public.messages(chat_id);
CREATE INDEX messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX messages_receiver_id_idx ON public.messages(receiver_id);


-- Enable Row-Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- POLICIES
-- Providers: Everyone can read provider profiles.
CREATE POLICY "Enable read access for all users" ON public.providers
FOR SELECT USING (true);

-- Reviews: Everyone can read reviews.
CREATE POLICY "Enable read access for all users" ON public.reviews
FOR SELECT USING (true);

-- Agreements:
CREATE POLICY "Users can view their own agreements" ON public.agreements
FOR SELECT USING (
    (SELECT auth.uid()) = customer_id OR (SELECT auth.uid()) = (SELECT user_id FROM providers WHERE id = provider_id)
);
CREATE POLICY "Users can insert their own agreements" ON public.agreements
FOR INSERT WITH CHECK ((SELECT auth.uid()) = customer_id);

CREATE POLICY "Providers can update their own agreements" ON public.agreements
FOR UPDATE USING ((SELECT auth.uid()) = (SELECT user_id FROM providers WHERE id = provider_id));

-- Messages:
CREATE POLICY "Users can view their own messages" ON public.messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages" ON public.messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- Function to get user's conversations
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE(
    chat_id TEXT,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_avatar TEXT,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH all_users AS (
        SELECT id, name, null::jsonb as profile_image, 'customer' as type FROM public.customers
        UNION ALL
        SELECT user_id as id, name, profile_image, 'provider' as type FROM public.providers
    ),
    last_messages AS (
        SELECT
            m.chat_id,
            m.content,
            m.created_at,
            m.sender_id,
            m.receiver_id,
            ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
        FROM public.messages m
        WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    )
    SELECT
        lm.chat_id,
        CASE
            WHEN lm.sender_id = p_user_id THEN lm.receiver_id
            ELSE lm.sender_id
        END AS other_user_id,
        u.name AS other_user_name,
        (u.profile_image ->> 'src')::text AS other_user_avatar,
        lm.content AS last_message_content,
        lm.created_at AS last_message_at
    FROM last_messages lm
    JOIN all_users u ON u.id = (
        CASE
            WHEN lm.sender_id = p_user_id THEN lm.receiver_id
            ELSE lm.sender_id
        END
    )
    WHERE lm.rn = 1
    ORDER BY lm.created_at DESC;
END;
$$;
