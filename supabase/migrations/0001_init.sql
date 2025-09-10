-- This script initializes the database with the core tables for users, providers, etc.
-- It uses 'bigserial' for auto-incrementing primary keys, which is a robust and standard approach.

-- Create the users table to store basic user information linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE NOT NULL,
    account_type text CHECK (account_type IN ('customer', 'provider')) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Stores public user profiles, linked to Supabase auth.';

-- Create the providers table for users who offer services
CREATE TABLE IF NOT EXISTS public.providers (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE NOT NULL,
    service character varying NOT NULL,
    location character varying NOT NULL DEFAULT 'ارومیه'::character varying,
    bio text NOT NULL,
    category_slug character varying NOT NULL,
    service_slug character varying NOT NULL,
    rating double precision NOT NULL DEFAULT 0,
    reviews_count integer NOT NULL DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.providers IS 'Stores detailed profiles for service providers.';

-- Create the customers table for users who consume services
CREATE TABLE IF NOT EXISTS public.customers (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.customers IS 'Stores profiles for customers.';

-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    customer_name character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores customer reviews for providers.';

-- Create the agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
    id bigserial PRIMARY KEY,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text CHECK (status IN ('pending', 'confirmed')),
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone
);
COMMENT ON TABLE public.agreements IS 'Tracks service agreements between customers and providers.';

-- Create the conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    participant_one_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_two_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_at timestamp with time zone,
    UNIQUE(participant_one_id, participant_two_id)
);
COMMENT ON TABLE public.conversations IS 'Represents a chat thread between two users.';

-- Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.messages IS 'Stores individual chat messages within a conversation.';

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can see all user profiles (as they are public)
CREATE POLICY "Public user profiles are viewable by everyone."
ON public.users FOR SELECT
USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile."
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile."
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Providers are publicly visible
CREATE POLICY "Providers are viewable by everyone."
ON public.providers FOR SELECT
USING (true);

-- Providers can only insert their own profile
CREATE POLICY "Providers can insert their own profile."
ON public.providers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Providers can only update their own profile
CREATE POLICY "Providers can update their own profile."
ON public.providers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow full access for customers on their own records
CREATE POLICY "Customers can manage their own profile."
ON public.customers FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anyone to read reviews
CREATE POLICY "Reviews are public."
ON public.reviews FOR SELECT
USING (true);

-- Allow authenticated users to insert reviews
CREATE POLICY "Authenticated users can create reviews."
ON public.reviews FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Agreements RLS
CREATE POLICY "Users can view their own agreements."
ON public.agreements FOR SELECT
USING (
    (SELECT phone FROM public.users WHERE id = auth.uid()) = provider_phone OR
    (SELECT phone FROM public.users WHERE id = auth.uid()) = customer_phone
);

CREATE POLICY "Customers can create agreements."
ON public.agreements FOR INSERT
WITH CHECK (
    (SELECT phone FROM public.users WHERE id = auth.uid()) = customer_phone
);

CREATE POLICY "Providers can update their own agreements."
ON public.agreements FOR UPDATE
USING (
    (SELECT phone FROM public.users WHERE id = auth.uid()) = provider_phone
);


-- Conversations RLS
CREATE POLICY "Users can view their own conversations."
ON public.conversations FOR SELECT
USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

CREATE POLICY "Users can create conversations they are a part of."
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);


-- Messages RLS
CREATE POLICY "Users can view messages in their conversations."
ON public.messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
    )
);

CREATE POLICY "Users can send messages in their conversations."
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
        SELECT id FROM public.conversations WHERE auth.uid() = participant_one_id OR auth.uid() = participant_two_id
    )
);

CREATE POLICY "Users can mark messages they received as read."
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Function to get or create a conversation and return its ID
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_id_1 uuid, p_user_id_2 uuid)
RETURNS TABLE(id uuid, created_at timestamptz, participant_one_id uuid, participant_two_id uuid, last_message_at timestamptz) AS $$
DECLARE
    v_conversation_id uuid;
    v_user_1 uuid;
    v_user_2 uuid;
    result_row conversations%ROWTYPE;
BEGIN
    -- Ensure consistent ordering of participants to avoid duplicate conversations
    IF p_user_id_1 < p_user_id_2 THEN
        v_user_1 := p_user_id_1;
        v_user_2 := p_user_id_2;
    ELSE
        v_user_1 := p_user_id_2;
        v_user_2 := p_user_id_1;
    END IF;

    -- Attempt to find an existing conversation
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE (c.participant_one_id = v_user_1 AND c.participant_two_id = v_user_2);

    -- If no conversation is found, create a new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_one_id, participant_two_id)
        VALUES (v_user_1, v_user_2)
        RETURNING conversations.id INTO v_conversation_id;
    END IF;

    -- Return the full conversation row
    SELECT * INTO result_row FROM public.conversations c WHERE c.id = v_conversation_id;
    RETURN QUERY SELECT * FROM public.conversations c WHERE c.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql;


-- Function to get metadata for all conversations for a specific user
CREATE OR REPLACE FUNCTION get_conversations_metadata(user_id uuid)
RETURNS TABLE (
    conversation_id uuid,
    last_message_content text,
    unread_count bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT
            m.conversation_id,
            m.content,
            m.created_at,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM public.messages m
        JOIN public.conversations c ON m.conversation_id = c.id
        WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id
    )
    SELECT
        c.id as conversation_id,
        lm.content as last_message_content,
        (
            SELECT COUNT(*)
            FROM public.messages m
            WHERE m.conversation_id = c.id
            AND m.receiver_id = user_id
            AND m.is_read = false
        )::bigint as unread_count
    FROM public.conversations c
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id
    ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at in conversations table
CREATE OR REPLACE FUNCTION update_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists before creating it
DROP TRIGGER IF EXISTS on_new_message ON public.messages;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_message_at();
