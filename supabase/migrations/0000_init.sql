
-- Enable the "pg_cron" extension for scheduled tasks.
create extension if not exists "pg_cron" with schema "extensions";

-- Enable the "pg_net" extension for network-related functions.
create extension if not exists "pg_net" with schema "extensions";

-- Enable the "pgsodium" extension for cryptographic functions.
create extension if not exists "pgsodium" with schema "extensions";

-- Enable the "supabase_vault" extension for secret management.
create extension if not exists "supabase_vault" with schema "extensions";

-- Enable the "uuid-ossp" extension to generate UUIDs.
create extension if not exists "uuid-ossp" with schema "public";

-- Define a custom type for account roles.
CREATE TYPE public.account_role AS ENUM (
    'customer',
    'provider'
);

-- Main table to store public user profile information, linking to the private auth.users table.
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL,
    phone character varying UNIQUE,
    account_type public.account_role,
    name character varying,
    created_at timestamp with time zone DEFAULT now(),
    profile_image jsonb,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Table to store detailed information about service providers.
CREATE TABLE IF NOT EXISTS public.providers (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    name character varying,
    phone character varying,
    service character varying,
    location character varying,
    bio text,
    category_slug character varying,
    service_slug character varying,
    rating real DEFAULT 0,
    reviews_count integer DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb[] DEFAULT '{}'::jsonb[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT providers_pkey PRIMARY KEY (id),
    CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Sequence for auto-incrementing the provider ID.
CREATE SEQUENCE IF NOT EXISTS public.providers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.providers_id_seq OWNED BY public.providers.id;
ALTER TABLE ONLY public.providers ALTER COLUMN id SET DEFAULT nextval('public.providers_id_seq'::regclass);

-- Table to store reviews left by customers for providers.
CREATE TABLE IF NOT EXISTS public.reviews (
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
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Sequence for auto-incrementing the review ID.
CREATE SEQUENCE IF NOT EXISTS public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;
ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


-- Table for real-time chat conversations.
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    participant_one_id uuid NOT NULL,
    participant_two_id uuid NOT NULL,
    last_message_at timestamp with time zone,
    CONSTRAINT conversations_pkey PRIMARY KEY (id),
    CONSTRAINT conversations_participant_one_id_fkey FOREIGN KEY (participant_one_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT conversations_participant_two_id_fkey FOREIGN KEY (participant_two_id) REFERENCES public.users(id) ON DELETE CASCADE
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Table for individual chat messages.
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
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


-- Function to update the last_message_at timestamp on the conversation.
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function after a new message is inserted.
CREATE OR REPLACE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_timestamp();

-- RLS Policies

-- Users table
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Providers table
CREATE POLICY "Enable read access for all users" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can insert their own profile" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Providers can delete their own profile" ON public.providers FOR DELETE USING (auth.uid() = user_id);

-- Reviews table
CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = customer_id);

-- Conversations table
CREATE POLICY "Users can only see their own conversations" ON public.conversations FOR SELECT USING ((auth.uid() = participant_one_id) OR (auth.uid() = participant_two_id));
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = participant_one_id) OR (auth.uid() = participant_two_id));

-- Messages table
CREATE POLICY "Users can only see messages in their conversations" ON public.messages FOR SELECT USING (conversation_id IN (SELECT id FROM public.conversations));
CREATE POLICY "Users can only send messages in their conversations" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id) AND (conversation_id IN (SELECT id FROM public.conversations)));

-- This trigger automatically creates a public user profile when a new user signs up in Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, phone, name, account_type)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.raw_user_meta_data->>'name',
    (NEW.raw_user_meta_data->>'account_type')::public.account_role
  );
  
  -- If the user is a provider, create an entry in the providers table as well.
  IF (NEW.raw_user_meta_data->>'account_type') = 'provider' THEN
    INSERT INTO public.providers (user_id, name, phone, service, location, bio, category_slug, service_slug, profile_image, portfolio)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      NEW.phone,
      NEW.raw_user_meta_data->>'service',
      NEW.raw_user_meta_data->>'location',
      NEW.raw_user_meta_data->>'bio',
      NEW.raw_user_meta_data->>'category_slug',
      NEW.raw_user_meta_data->>'service_slug',
      '{"src": "", "ai_hint": "woman portrait"}',
      '{}'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't already exist.
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'on_auth_user_created'
   ) THEN
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   END IF;
END
$$;

-- Function to get conversation metadata (last message and unread count) for a user.
CREATE OR REPLACE FUNCTION public.get_conversations_metadata(user_id uuid)
RETURNS TABLE(conversation_id uuid, last_message_content text, unread_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id as conversation_id,
    (
      SELECT content FROM public.messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) as last_message_content,
    (
      SELECT COUNT(*) FROM public.messages
      WHERE conversation_id = c.id AND receiver_id = user_id AND is_read = false
    ) as unread_count
  FROM
    public.conversations c
  WHERE
    c.participant_one_id = user_id OR c.participant_two_id = user_id;
$$;


-- Function to get or create a conversation between two users.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user_id_1 uuid, p_user_id_2 uuid)
RETURNS public.conversations
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation public.conversations;
BEGIN
  -- Try to find an existing conversation
  SELECT *
  INTO v_conversation
  FROM public.conversations
  WHERE
    (participant_one_id = p_user_id_1 AND participant_two_id = p_user_id_2)
    OR (participant_one_id = p_user_id_2 AND participant_two_id = p_user_id_1);

  -- If not found, create a new one
  IF v_conversation IS NULL THEN
    INSERT INTO public.conversations (participant_one_id, participant_two_id)
    VALUES (p_user_id_1, p_user_id_2)
    RETURNING * INTO v_conversation;
  END IF;

  RETURN v_conversation;
END;
$$;
