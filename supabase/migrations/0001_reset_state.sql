-- Drop existing tables with cascade to remove dependencies
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.agreements CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    phone character varying NOT NULL,
    account_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    profile_image jsonb,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT users_phone_key UNIQUE (phone)
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read user data" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create providers table
CREATE TABLE public.providers (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    name character varying NOT NULL,
    phone character varying NOT NULL,
    service text,
    location text,
    bio text,
    category_slug text,
    service_slug text,
    rating real DEFAULT 0 NOT NULL,
    reviews_count integer DEFAULT 0 NOT NULL,
    profile_image jsonb,
    portfolio jsonb[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT providers_pkey PRIMARY KEY (id),
    CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT providers_phone_key UNIQUE (phone),
    CONSTRAINT providers_user_id_key UNIQUE (user_id)
);
CREATE SEQUENCE public.providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq'::regclass);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Allow provider to update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create customers table
CREATE TABLE public.customers (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT customers_user_id_key UNIQUE (user_id)
);
CREATE SEQUENCE public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to manage their own customer profile" ON public.customers FOR ALL USING (auth.uid() = user_id);

-- Create reviews table
CREATE TABLE public.reviews (
    id bigint NOT NULL,
    provider_id bigint NOT NULL,
    customer_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_name character varying,
    CONSTRAINT reviews_pkey PRIMARY KEY (id),
    CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE,
    CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE SEQUENCE public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow customer to insert their own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Create agreements table
CREATE TABLE public.agreements (
    id bigint NOT NULL,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone,
    CONSTRAINT agreements_pkey PRIMARY KEY (id),
    CONSTRAINT agreements_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text])))
);
CREATE SEQUENCE public.agreements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.agreements ALTER COLUMN id SET DEFAULT nextval('public.agreements_id_seq'::regclass);
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow involved users to see their agreements" ON public.agreements FOR SELECT USING (((auth.jwt() ->> 'phone'::text) = customer_phone) OR ((auth.jwt() ->> 'phone'::text) = provider_phone));
CREATE POLICY "Allow provider to update agreement status" ON public.agreements FOR UPDATE USING (((auth.jwt() ->> 'phone'::text) = provider_phone)) WITH CHECK (((auth.jwt() ->> 'phone'::text) = provider_phone));

-- Create conversations table
CREATE TABLE public.conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    participant_one_id uuid NOT NULL,
    participant_two_id uuid NOT NULL,
    last_message_at timestamp with time zone,
    CONSTRAINT conversations_pkey PRIMARY KEY (id),
    CONSTRAINT conversations_participant_one_id_fkey FOREIGN KEY (participant_one_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT conversations_participant_two_id_fkey FOREIGN KEY (participant_two_id) REFERENCES public.users(id) ON DELETE CASCADE
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow participants to access their conversations" ON public.conversations FOR SELECT USING ((auth.uid() = participant_one_id) OR (auth.uid() = participant_two_id));

-- Create messages table
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow participants to access messages in their conversations" ON public.messages FOR SELECT USING (EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.participant_one_id = auth.uid()) OR (conversations.participant_two_id = auth.uid())))));
CREATE POLICY "Allow participants to send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Allow receiver to mark messages as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);