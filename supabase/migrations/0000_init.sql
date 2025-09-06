
-- Enable the "pg_cron" extension for scheduled tasks.
create extension if not exists "pg_cron" with schema "extensions";

-- Enable the "pg_net" extension for network-related functions.
create extension if not exists "pg_net" with schema "extensions";

-- Enable the "uuid-ossp" extension for UUID generation functions.
create extension if not exists "uuid-ossp" with schema "extensions";

-- Set the timezone for the database session to UTC.
set TimeZone to 'UTC';

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--
-- Create the public schema if it does not already exist.
CREATE SCHEMA if not exists "public";

-- Grant usage rights on the public schema to the 'postgres' user.
GRANT USAGE ON SCHEMA "public" TO "postgres";

-- Grant usage rights on the public schema to the 'anon' role (anonymous users).
GRANT USAGE ON SCHEMA "public" TO "anon";

-- Grant usage rights on the public schema to the 'authenticated' role (logged-in users).
GRANT USAGE ON SCHEMA "public" TO "authenticated";

-- Grant usage rights on the public schema to the 'service_role' (system-level access).
GRANT USAGE ON SCHEMA "public" TO "service_role";

--
-- Create a table to store user profiles, linked to Supabase's authentication users.
-- This table holds public-facing information about each user.
--
CREATE TABLE "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "account_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Add a comment explaining the purpose of the 'users' table.
COMMENT ON TABLE "public"."users" IS 'Public user profiles, linked to auth.users';

--
-- Create a sequence for generating unique IDs for the providers table.
--
CREATE SEQUENCE "public"."providers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Create the providers table to store information about service providers.
-- It references the 'users' table via the user_id foreign key.
--
CREATE TABLE "public"."providers" (
    "id" "int4" DEFAULT "nextval"('public.providers_id_seq'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "service" "text" NOT NULL,
    "location" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "bio" "text" NOT NULL,
    "category_slug" "text" NOT NULL,
    "service_slug" "text" NOT NULL,
    "rating" real DEFAULT 0 NOT NULL,
    "reviews_count" integer DEFAULT 0 NOT NULL,
    "profile_image" "jsonb",
    "portfolio" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

--
-- Create the customers table, which could be used to store customer-specific data.
--
CREATE TABLE "public"."customers" (
    "id" "int4" DEFAULT "nextval"('public.providers_id_seq'::"regclass") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

--
-- Create a sequence for generating unique IDs for the agreements table.
--
CREATE SEQUENCE "public"."agreements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Create the agreements table to track agreements between customers and providers.
--
CREATE TABLE "public"."agreements" (
    "id" "int4" DEFAULT "nextval"('public.agreements_id_seq'::"regclass") NOT NULL,
    "customer_phone" "text" NOT NULL,
    "provider_phone" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confirmed_at" timestamp with time zone
);

-- Add a comment explaining the purpose of the 'agreements' table.
COMMENT ON TABLE "public"."agreements" IS 'Tracks service agreements between customers and providers';

--
-- Create a sequence for generating unique IDs for the reviews table.
--
CREATE SEQUENCE "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Create the reviews table for customers to review providers.
--
CREATE TABLE "public"."reviews" (
    "id" "int4" DEFAULT "nextval"('public.reviews_id_seq'::"regclass") NOT NULL,
    "provider_id" "int4" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "rating" "int4" NOT NULL,
    "comment" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "customer_name" "text" NOT NULL
);


--
-- Create the conversations table to store chat conversation metadata.
--
CREATE TABLE "public"."conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "participant_one_id" "uuid" NOT NULL,
    "participant_two_id" "uuid" NOT NULL,
    "last_message_at" timestamp with time zone
);

-- Add a comment explaining the purpose of the 'conversations' table.
COMMENT ON TABLE "public"."conversations" IS 'Stores chat conversation metadata';

--
-- Create the messages table to store individual chat messages.
--
CREATE TABLE "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL
);

-- Add a comment explaining the purpose of the 'messages' table.
COMMENT ON TABLE "public"."messages" IS 'Stores individual chat messages';

--
-- Primary Key Constraints
--
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."providers" ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."customers" ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."agreements" ADD CONSTRAINT "agreements_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."reviews" ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."conversations" ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."messages" ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");

--
-- Foreign Key Constraints
--
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."providers" ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reviews" ADD CONSTRAINT "reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."conversations" ADD CONSTRAINT "conversations_participant_one_id_fkey" FOREIGN KEY ("participant_one_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."conversations" ADD CONSTRAINT "conversations_participant_two_id_fkey" FOREIGN KEY ("participant_two_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

--
-- Row Level Security (RLS) Policies
--
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."agreements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."providers" FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "Enable read for all users" ON "public"."reviews" FOR SELECT USING (true);
CREATE POLICY "Allow individual read access" ON "public"."agreements" FOR SELECT USING (("auth"."uid"() IN ( SELECT "u"."id" FROM "public"."users" "u" WHERE (("u"."phone" = "agreements"."provider_phone") OR ("u"."phone" = "agreements"."customer_phone")))));
CREATE POLICY "Allow individual update" ON "public"."agreements" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "u"."id" FROM "public"."users" "u" WHERE ("u"."phone" = "agreements"."provider_phone")))) WITH CHECK (("auth"."uid"() IN ( SELECT "u"."id" FROM "public"."users" "u" WHERE ("u"."phone" = "agreements"."provider_phone"))));
CREATE POLICY "Enable insert for authenticated users" ON "public"."agreements" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IN ( SELECT "u"."id" FROM "public"."users" "u" WHERE ("u"."phone" = "agreements"."customer_phone"))));
CREATE POLICY "Enable read access for participants" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() IN ("participant_one_id", "participant_two_id")));
CREATE POLICY "Enable insert for participants" ON "public"."messages" FOR INSERT WITH CHECK (("sender_id" = "auth"."uid"()));
CREATE POLICY "Enable read access for participants" ON "public"."messages" FOR SELECT USING (("auth"."uid"() IN ("sender_id", "receiver_id")));

--
-- RPC Functions
--
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user_id_1 uuid, p_user_id_2 uuid)
RETURNS TABLE(
    id uuid,
    created_at timestamptz,
    participant_one_id uuid,
    participant_two_id uuid,
    last_message_at timestamptz
) AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Ensure consistent ordering of participants
    IF p_user_id_1 > p_user_id_2 THEN
        SELECT p_user_id_2, p_user_id_1 INTO p_user_id_1, p_user_id_2;
    END IF;

    -- Attempt to find an existing conversation
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.participant_one_id = p_user_id_1 AND c.participant_two_id = p_user_id_2;

    -- If no conversation exists, create one
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_one_id, participant_two_id)
        VALUES (p_user_id_1, p_user_id_2)
        RETURNING conversations.id INTO v_conversation_id;
    END IF;

    -- Return the details of the existing or new conversation
    RETURN QUERY
    SELECT *
    FROM public.conversations
    WHERE conversations.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_conversations_metadata(user_id uuid)
RETURNS TABLE(
    conversation_id uuid,
    last_message_content text,
    unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
      c.id AS conversation_id,
      (SELECT content FROM public.messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_content,
      (SELECT COUNT(*) FROM public.messages WHERE conversation_id = c.id AND receiver_id = user_id AND is_read = false) AS unread_count
  FROM
      public.conversations c
  WHERE
      c.participant_one_id = user_id OR c.participant_two_id = user_id;
END;
$$ LANGUAGE plpgsql;
