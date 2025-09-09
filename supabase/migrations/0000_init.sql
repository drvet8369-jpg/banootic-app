
-- Enable the pgcrypto extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Function to check if a policy exists
CREATE OR REPLACE FUNCTION policy_exists(
    p_tablename TEXT,
    p_policyname TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = p_tablename
        AND policyname = p_policyname
    );
END;
$$ LANGUAGE plpgsql;

--
-- Create users table
-- This table stores public profile information for all users (customers and providers).
--
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    account_type TEXT NOT NULL CHECK (account_type IN ('customer', 'provider')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.users IS 'Public profiles for all application users.';

-- Enable Row Level Security for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
DO $$
BEGIN
    IF NOT policy_exists('users', 'Allow public read access to users') THEN
        CREATE POLICY "Allow public read access to users"
        ON public.users FOR SELECT USING (true);
    END IF;
    IF NOT policy_exists('users', 'Allow users to update their own profile') THEN
        CREATE POLICY "Allow users to update their own profile"
        ON public.users FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;


--
-- Create providers table
-- This table stores specific information for users who are service providers.
--
CREATE TABLE IF NOT EXISTS public.providers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    service TEXT,
    location TEXT,
    bio TEXT,
    category_slug TEXT,
    service_slug TEXT,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 0.0,
    reviews_count INT NOT NULL DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.providers IS 'Stores detailed profiles for service providers.';

-- Enable Row Level Security for providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Policies for providers table
DO $$
BEGIN
    IF NOT policy_exists('providers', 'Allow public read access to providers') THEN
        CREATE POLICY "Allow public read access to providers"
        ON public.providers FOR SELECT USING (true);
    END IF;
    IF NOT policy_exists('providers', 'Allow providers to insert their own profile') THEN
        CREATE POLICY "Allow providers to insert their own profile"
        ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT policy_exists('providers', 'Allow providers to update their own profile') THEN
        CREATE POLICY "Allow providers to update their own profile"
        ON public.providers FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;


--
-- Create reviews table
--
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    customer_name TEXT NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores reviews and ratings given by customers to providers.';

-- Enable Row Level Security for reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews table
DO $$
BEGIN
    IF NOT policy_exists('reviews', 'Allow public read access to reviews') THEN
        CREATE POLICY "Allow public read access to reviews"
        ON public.reviews FOR SELECT USING (true);
    END IF;
    IF NOT policy_exists('reviews', 'Allow authenticated users to insert reviews') THEN
        CREATE POLICY "Allow authenticated users to insert reviews"
        ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
    END IF;
END $$;


--
-- Create agreements table
--
CREATE TABLE IF NOT EXISTS public.agreements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_phone TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, confirmed
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(provider_phone, customer_phone)
);
COMMENT ON TABLE public.agreements IS 'Tracks service agreements between customers and providers.';

-- Enable Row Level Security for agreements table
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policies for agreements table
DO $$
BEGIN
    IF NOT policy_exists('agreements', 'Allow users to see their own agreements') THEN
        CREATE POLICY "Allow users to see their own agreements"
        ON public.agreements FOR SELECT USING (
            (SELECT phone FROM public.users WHERE id = auth.uid()) = provider_phone OR
            (SELECT phone FROM public.users WHERE id = auth.uid()) = customer_phone
        );
    END IF;
    IF NOT policy_exists('agreements', 'Allow customers to create agreements') THEN
        CREATE POLICY "Allow customers to create agreements"
        ON public.agreements FOR INSERT WITH CHECK (
            (SELECT phone FROM public.users WHERE id = auth.uid()) = customer_phone
        );
    END IF;
    IF NOT policy_exists('agreements', 'Allow providers to update their agreements') THEN
        CREATE POLICY "Allow providers to update their agreements"
        ON public.agreements FOR UPDATE USING (
            (SELECT phone FROM public.users WHERE id = auth.uid()) = provider_phone
        );
    END IF;
END $$;

--
-- Create conversations and messages tables for chat
--
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    participant_one_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_two_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    UNIQUE(participant_one_id, participant_two_id)
);
COMMENT ON TABLE public.conversations IS 'Represents a chat thread between two users.';

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read BOOLEAN NOT NULL DEFAULT false
);
COMMENT ON TABLE public.messages IS 'Stores individual chat messages within a conversation.';

-- Enable RLS for chat tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat tables
DO $$
BEGIN
    IF NOT policy_exists('conversations', 'Allow participants to access their conversations') THEN
        CREATE POLICY "Allow participants to access their conversations"
        ON public.conversations FOR SELECT USING (
            auth.uid() = participant_one_id OR auth.uid() = participant_two_id
        );
    END IF;

    IF NOT policy_exists('messages', 'Allow participants to access messages in their conversations') THEN
        CREATE POLICY "Allow participants to access messages in their conversations"
        ON public.messages FOR SELECT USING (
            conversation_id IN (
                SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
            )
        );
    END IF;

    IF NOT policy_exists('messages', 'Allow participants to send messages') THEN
        CREATE POLICY "Allow participants to send messages"
        ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
    
    IF NOT policy_exists('messages', 'Allow receivers to mark messages as read') THEN
        CREATE POLICY "Allow receivers to mark messages as read"
        ON public.messages FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
    END IF;
END $$;


--
-- Create RPC function to get or create a conversation
--
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_id_1 UUID, p_user_id_2 UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    participant_one_id UUID,
    participant_two_id UUID,
    last_message_at TIMESTAMPTZ
) AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Ensure consistent ordering of participants to use the UNIQUE constraint
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE (c.participant_one_id = p_user_id_1 AND c.participant_two_id = p_user_id_2)
       OR (c.participant_one_id = p_user_id_2 AND c.participant_two_id = p_user_id_1);

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_one_id, participant_two_id)
        VALUES (
            LEAST(p_user_id_1, p_user_id_2),
            GREATEST(p_user_id_1, p_user_id_2)
        )
        RETURNING public.conversations.id INTO v_conversation_id;
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.conversations
    WHERE public.conversations.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--
-- Create RPC function to get conversation metadata
--
CREATE OR REPLACE FUNCTION public.get_conversations_metadata(user_id uuid)
RETURNS TABLE(conversation_id uuid, last_message_content text, unread_count bigint)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.id as conversation_id,
        (
            SELECT m.content
            FROM public.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ) as last_message_content,
        (
            SELECT count(*)
            FROM public.messages m
            WHERE m.conversation_id = c.id
            AND m.receiver_id = user_id
            AND m.is_read = false
        ) as unread_count
    FROM
        public.conversations c
    WHERE
        c.participant_one_id = user_id OR c.participant_two_id = user_id;
$$;
