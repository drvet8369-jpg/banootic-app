
-- Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE,
    account_type character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    profile_image jsonb
);

-- Create Providers Table
CREATE TABLE IF NOT EXISTS public.providers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE,
    service character varying,
    location character varying,
    bio text,
    category_slug character varying,
    service_slug character varying,
    rating double precision,
    reviews_count integer,
    profile_image jsonb,
    portfolio jsonb[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_name character varying
);

-- Create Agreements Table
CREATE TABLE IF NOT EXISTS public.agreements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone
);

-- Set up RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policies for Users
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for Providers
CREATE POLICY "Public can view providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can insert their own profile" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Policies for Agreements
CREATE POLICY "Users can view their own agreements" ON public.agreements FOR SELECT USING (((SELECT auth.jwt() ->> 'phone'::text) = customer_phone) OR ((SELECT auth.jwt() ->> 'phone'::text) = provider_phone));
CREATE POLICY "Customers can create agreements" ON public.agreements FOR INSERT WITH CHECK (((SELECT auth.jwt() ->> 'phone'::text) = customer_phone));
CREATE POLICY "Providers can update their own agreements" ON public.agreements FOR UPDATE USING (((SELECT auth.jwt() ->> 'phone'::text) = provider_phone));

-- Create function to get or create a conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_id_1 uuid, p_user_id_2 uuid)
RETURNS TABLE(conversation_id uuid) AS $$
BEGIN
    -- Try to find an existing conversation
    SELECT id INTO conversation_id FROM public.conversations
    WHERE (participant_one_id = p_user_id_1 AND participant_two_id = p_user_id_2)
       OR (participant_one_id = p_user_id_2 AND participant_two_id = p_user_id_1);

    -- If not found, create a new one
    IF conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_one_id, participant_two_id)
        VALUES (p_user_id_1, p_user_id_2)
        RETURNING id INTO conversation_id;
    END IF;

    RETURN QUERY SELECT conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get conversation metadata
CREATE OR REPLACE FUNCTION get_conversations_metadata(user_id uuid)
RETURNS TABLE (
    conversation_id uuid,
    last_message_content text,
    unread_count bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH unread_counts AS (
        SELECT
            m.conversation_id,
            COUNT(*) FILTER (WHERE m.is_read = false AND m.receiver_id = user_id) as unread
        FROM messages m
        GROUP BY m.conversation_id
    ),
    last_messages AS (
        SELECT
            m.conversation_id,
            m.content,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM messages m
    )
    SELECT
        c.id,
        lm.content,
        COALESCE(uc.unread, 0)
    FROM conversations c
    LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
CREATE POLICY "Allow public read access to images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow users to update their own images" ON storage.objects FOR UPDATE TO authenticated USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow users to delete their own images" ON storage.objects FOR DELETE TO authenticated USING (auth.uid()::text = (storage.foldername(name))[1]);

