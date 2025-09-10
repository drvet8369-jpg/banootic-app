
-- Create users table
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying UNIQUE,
    account_type character varying,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);


-- Create providers table
CREATE TABLE public.providers (
    id bigint NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying,
    service text,
    location text,
    bio text,
    category_slug text,
    service_slug text,
    rating double precision DEFAULT 0,
    reviews_count integer DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.providers ADD PRIMARY KEY (id);
CREATE SEQUENCE public.providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq');
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers are public to view" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Create customers table
CREATE TABLE public.customers (
    id bigint NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.customers ADD PRIMARY KEY (id);
CREATE SEQUENCE public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq');
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view their own profile" ON public.customers FOR SELECT USING (auth.uid() = user_id);

-- Create reviews table
CREATE TABLE public.reviews (
    id bigint NOT NULL,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    customer_name character varying
);
ALTER TABLE public.reviews ADD PRIMARY KEY (id);
CREATE SEQUENCE public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq');
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public to view" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- Create agreements table
CREATE TABLE public.agreements (
    id bigint NOT NULL,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status text DEFAULT 'pending'::text,
    requested_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone
);

ALTER TABLE public.agreements ADD PRIMARY KEY (id);

CREATE SEQUENCE public.agreements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.agreements ALTER COLUMN id SET DEFAULT nextval('public.agreements_id_seq');

ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agreements" ON public.agreements FOR SELECT USING (
  (auth.jwt()->>'phone' = customer_phone) OR (auth.jwt()->>'phone' = provider_phone)
);

CREATE POLICY "Customers can create agreements" ON public.agreements FOR INSERT WITH CHECK (
  (auth.jwt()->>'phone' = customer_phone) AND (auth.role() = 'authenticated')
);

CREATE POLICY "Providers can update their agreements" ON public.agreements FOR UPDATE USING (
  (auth.jwt()->>'phone' = provider_phone)
);


-- Create conversations table
CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    participant_one_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_two_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_at timestamp with time zone,
    CONSTRAINT unique_conversation UNIQUE (participant_one_id, participant_two_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view their own conversations" ON public.conversations FOR SELECT USING (
    (auth.uid() = participant_one_id) OR (auth.uid() = participant_two_id)
);


-- Create messages table
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text,
    created_at timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view messages in their conversations" ON public.messages FOR SELECT USING (
    conversation_id IN (
        SELECT id FROM public.conversations WHERE (auth.uid() = participant_one_id) OR (auth.uid() = participant_two_id)
    )
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can mark messages as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);


-- Create Storage Bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public access for all images" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING ( bucket_id = 'images' AND auth.uid() = owner );
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING ( bucket_id = 'images' AND auth.uid() = owner );

-- RPC Functions

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user_id_1 uuid, p_user_id_2 uuid)
RETURNS TABLE(id uuid, created_at timestamptz, participant_one_id uuid, participant_two_id uuid, last_message_at timestamptz) AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE (c.participant_one_id = p_user_id_1 AND c.participant_two_id = p_user_id_2)
       OR (c.participant_one_id = p_user_id_2 AND c.participant_two_id = p_user_id_1);

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations(participant_one_id, participant_two_id)
        VALUES (p_user_id_1, p_user_id_2)
        RETURNING public.conversations.id INTO v_conversation_id;
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.conversations c
    WHERE c.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.get_conversations_metadata(user_id uuid)
RETURNS TABLE(conversation_id uuid, last_message_content text, unread_count bigint) AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT
            m.conversation_id,
            m.content,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM public.messages m
    ),
    unread_counts AS (
        SELECT
            m.conversation_id,
            count(*) as unread
        FROM public.messages m
        WHERE m.receiver_id = user_id AND m.is_read = false
        GROUP BY m.conversation_id
    )
    SELECT
        c.id as conversation_id,
        lm.content as last_message_content,
        COALESCE(uc.unread, 0) as unread_count
    FROM public.conversations c
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
    WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.update_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_message_at();
