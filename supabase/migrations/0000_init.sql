-- Honarbanoo Initial Schema Migration
-- Version: 4.0 (Complete Reset & Rebuild)
-- This script is designed to be idempotent and safe to run multiple times.
-- It will completely reset the public schema to a known good state.

-- STEP 0: Terminate any active connections to the database to avoid locking issues during DROP.
-- This is an aggressive but effective way to ensure a clean slate.
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'postgres' AND pid <> pg_backend_pid();

-- STEP 1: Drop everything in the correct dependency order.
-- We start from objects that depend on others and move towards the base tables.
-- The use of "CASCADE" is crucial to remove dependent objects like policies, triggers, and foreign keys.
DROP TABLE IF EXISTS "public"."messages" CASCADE;
DROP TABLE IF EXISTS "public"."conversations" CASCADE;
DROP TABLE IF EXISTS "public"."reviews" CASCADE;
DROP TABLE IF EXISTS "public"."agreements" CASCADE;
DROP TABLE IF EXISTS "public"."providers" CASCADE;
DROP TABLE IF EXISTS "public"."customers" CASCADE;
DROP TABLE IF EXISTS "public"."users" CASCADE;

-- Drop custom types as well, as they will be recreated.
DROP TYPE IF EXISTS "public"."user_account_type";

-- STEP 2: Recreate custom types.
-- This defines the allowed values for the account_type column.
CREATE TYPE "public"."user_account_type" AS ENUM ('provider', 'customer');

-- STEP 3: Recreate tables in the correct dependency order.
-- Start with tables that have no foreign key dependencies.

-- users table: The foundation for all user-related data.
CREATE TABLE "public"."users" (
    "id" uuid NOT NULL,
    "name" text NOT NULL,
    "phone" text NOT NULL,
    "account_type" user_account_type NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "users_pkey" PRIMARY KEY (id),
    CONSTRAINT "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "users_phone_key" UNIQUE (phone)
);
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "public"."users" IS 'Stores public user profile information.';

-- providers table: Stores information specific to service providers.
CREATE TABLE "public"."providers" (
    "id" bigint NOT NULL,
    "user_id" uuid NOT NULL,
    "name" text NOT NULL,
    "phone" text NOT NULL,
    "service" text NOT NULL,
    "location" text NOT NULL,
    "bio" text NOT NULL,
    "category_slug" text NOT NULL,
    "service_slug" text NOT NULL,
    "rating" real NOT NULL DEFAULT '0'::real,
    "reviews_count" integer NOT NULL DEFAULT 0,
    "profile_image" jsonb,
    "portfolio" jsonb[],
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "providers_pkey" PRIMARY KEY (id),
    CONSTRAINT "providers_id_key" UNIQUE (id),
    CONSTRAINT "providers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "public"."users"(id) ON DELETE CASCADE
);
ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "public"."providers" IS 'Profile data for service providers.';
-- Create the sequence for the auto-incrementing primary key.
CREATE SEQUENCE "public"."providers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."providers" ALTER COLUMN "id" SET DEFAULT nextval('public.providers_id_seq'::regclass);

-- customers table: Placeholder for future customer-specific data.
CREATE TABLE "public"."customers" (
    "id" bigint NOT NULL,
    "user_id" uuid NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "customers_pkey" PRIMARY KEY (id),
    CONSTRAINT "customers_id_key" UNIQUE (id),
    CONSTRAINT "customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "public"."users"(id) ON DELETE CASCADE
);
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "public"."customers" IS 'Profile data for customers.';
-- Create the sequence for the auto-incrementing primary key.
CREATE SEQUENCE "public"."customers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."customers" ALTER COLUMN "id" SET DEFAULT nextval('public.customers_id_seq'::regclass);


-- reviews table: Stores reviews from customers for providers.
CREATE TABLE "public"."reviews" (
    "id" bigint NOT NULL,
    "provider_id" bigint NOT NULL,
    "customer_id" uuid NOT NULL,
    "rating" integer NOT NULL,
    "comment" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "customer_name" text NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY (id),
    CONSTRAINT "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES "public"."users"(id) ON DELETE CASCADE,
    CONSTRAINT "reviews_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES "public"."providers"(id) ON DELETE CASCADE
);
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "public"."reviews" IS 'Stores customer reviews for providers.';
-- Create the sequence for the auto-incrementing primary key.
CREATE SEQUENCE "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."reviews" ALTER COLUMN "id" SET DEFAULT nextval('public.reviews_id_seq'::regclass);

-- agreements table: Tracks service agreements between customers and providers.
CREATE TABLE "public"."agreements" (
    "id" bigint NOT NULL,
    "customer_phone" text NOT NULL,
    "provider_phone" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "requested_at" timestamp with time zone NOT NULL DEFAULT now(),
    "confirmed_at" timestamp with time zone,
    CONSTRAINT "agreements_pkey" PRIMARY KEY (id)
);
ALTER TABLE "public"."agreements" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "public"."agreements" IS 'Tracks service agreements between users.';
-- Create the sequence for the auto-incrementing primary key.
CREATE SEQUENCE "public"."agreements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."agreements" ALTER COLUMN "id" SET DEFAULT nextval('public.agreements_id_seq'::regclass);


-- conversations table: Represents a chat thread between two users.
CREATE TABLE "public"."conversations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "participant_one_id" uuid NOT NULL,
    "participant_two_id" uuid NOT NULL,
    "last_message_at" timestamp with time zone,
    CONSTRAINT "conversations_pkey" PRIMARY KEY (id),
    CONSTRAINT "conversations_participant_one_id_fkey" FOREIGN KEY (participant_one_id) REFERENCES "public"."users"(id) ON DELETE CASCADE,
    CONSTRAINT "conversations_participant_two_id_fkey" FOREIGN KEY (participant_two_id) REFERENCES "public"."users"(id) ON DELETE CASCADE,
    CONSTRAINT "conversations_check" CHECK (participant_one_id <> participant_two_id)
);
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "public"."conversations" IS 'A chat thread between two users.';

-- messages table: Stores individual chat messages within a conversation.
CREATE TABLE "public"."messages" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" uuid NOT NULL,
    "sender_id" uuid NOT NULL,
    "receiver_id" uuid NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "is_read" boolean NOT NULL DEFAULT false,
    CONSTRAINT "messages_pkey" PRIMARY KEY (id),
    CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES "public"."conversations"(id) ON DELETE CASCADE,
    CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES "public"."users"(id) ON DELETE CASCADE,
    CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES "public"."users"(id) ON DELETE CASCADE
);
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "public"."messages" IS 'Individual messages within a conversation.';


-- STEP 4: Create functions
-- This function gets or creates a conversation between two users and returns its ID.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    p_user_id_1 uuid,
    p_user_id_2 uuid
)
RETURNS uuid AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Ensure user IDs are ordered to prevent duplicate conversations
    IF p_user_id_1 > p_user_id_2 THEN
        SELECT p_user_id_2, p_user_id_1 INTO p_user_id_1, p_user_id_2;
    END IF;

    -- Check if a conversation already exists
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE participant_one_id = p_user_id_1 AND participant_two_id = p_user_id_2;

    -- If not, create a new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_one_id, participant_two_id)
        VALUES (p_user_id_1, p_user_id_2)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- This function retrieves metadata for a user's conversations.
CREATE OR REPLACE FUNCTION public.get_conversations_metadata(user_id uuid)
RETURNS TABLE(conversation_id uuid, last_message_content text, unread_count bigint) AS $$
BEGIN
    RETURN QUERY
    WITH unread_counts AS (
        SELECT
            m.conversation_id,
            count(*) AS unread
        FROM public.messages m
        WHERE m.receiver_id = user_id AND m.is_read = false
        GROUP BY m.conversation_id
    ),
    last_messages AS (
        SELECT
            m.conversation_id,
            m.content,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM public.messages m
    )
    SELECT
        c.id,
        lm.content,
        COALESCE(uc.unread, 0) AS unread
    FROM public.conversations c
    LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id;
END;
$$ LANGUAGE plpgsql;


-- STEP 5: Create Row Level Security (RLS) policies

-- USERS table policies
CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on user_id" ON "public"."users" FOR UPDATE USING (auth.uid() = id);

-- PROVIDERS table policies
CREATE POLICY "Enable read access for all users" ON "public"."providers" FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."providers" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on user_id" ON "public"."providers" FOR UPDATE USING (auth.uid() = user_id);

-- CUSTOMERS table policies
CREATE POLICY "Enable read access for all users" ON "public"."customers" FOR SELECT USING (true);

-- AGREEMENTS table policies
CREATE POLICY "Enable read for related users" ON "public"."agreements" FOR SELECT USING (
    (SELECT phone FROM users WHERE id = auth.uid()) = provider_phone OR
    (SELECT phone FROM users WHERE id = auth.uid()) = customer_phone
);
CREATE POLICY "Enable insert for authenticated users" ON "public"."agreements" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for provider" ON "public"."agreements" FOR UPDATE USING ((SELECT phone FROM users WHERE id = auth.uid()) = provider_phone);

-- REVIEWS table policies
CREATE POLICY "Enable read access for all users" ON "public"."reviews" FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."reviews" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CONVERSATIONS table policies
CREATE POLICY "Enable read access for participants" ON "public"."conversations" FOR SELECT USING (
    auth.uid() = participant_one_id OR auth.uid() = participant_two_id
);

-- MESSAGES table policies
CREATE POLICY "Enable read access for participants" ON "public"."messages" FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Enable insert for sender" ON "public"."messages" FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Enable update for sender on unread messages" ON "public"."messages" FOR UPDATE USING (auth.uid() = sender_id AND is_read = false);

-- Grant usage on schemas and sequences
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER USER "postgres" SET search_path = 'public', 'auth';
