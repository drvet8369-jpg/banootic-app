
-- Full script to drop existing objects and recreate the entire schema.
-- This ensures a clean slate and avoids dependency errors.

-- ========= TEARDOWN (Drop existing objects in reverse order of creation) =========
DROP TABLE IF EXISTS "public"."messages" CASCADE;
DROP TABLE IF EXISTS "public"."reviews" CASCADE;
DROP TABLE IF EXISTS "public"."agreements" CASCADE;
DROP TABLE IF EXISTS "public"."providers" CASCADE;
DROP TABLE IF EXISTS "public"."customers" CASCADE;
DROP TABLE IF EXISTS "public"."conversations" CASCADE;
DROP TABLE IF EXISTS "public"."users" CASCADE;


-- ========= SETUP (Create objects from scratch with correct definitions) =========

-- Create the users table to store public profile information.
CREATE TABLE "public"."users" (
    "id" uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "phone" varchar(20) UNIQUE NOT NULL,
    "account_type" text CHECK (account_type IN ('customer', 'provider')) NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Create the providers table
CREATE TABLE "public"."providers" (
    "id" bigserial PRIMARY KEY,
    "user_id" uuid NOT NULL UNIQUE REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "phone" varchar(20) UNIQUE NOT NULL,
    "service" text NOT NULL,
    "location" text NOT NULL,
    "bio" text NOT NULL,
    "category_slug" text NOT NULL,
    "service_slug" text NOT NULL,
    "rating" real NOT NULL DEFAULT 0,
    "reviews_count" integer NOT NULL DEFAULT 0,
    "profile_image" jsonb,
    "portfolio" jsonb[],
    "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Create the customers table
CREATE TABLE "public"."customers" (
    "id" bigserial PRIMARY KEY,
    "user_id" uuid NOT NULL UNIQUE REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

-- Create the reviews table
CREATE TABLE "public"."reviews" (
    "id" bigserial PRIMARY KEY,
    "provider_id" bigint NOT NULL REFERENCES "public"."providers"(id) ON DELETE CASCADE,
    "customer_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "customer_name" text NOT NULL
);

-- Create the agreements table
CREATE TABLE "public"."agreements" (
    "id" bigserial PRIMARY KEY,
    "customer_phone" text NOT NULL,
    "provider_phone" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    "requested_at" timestamptz NOT NULL DEFAULT now(),
    "confirmed_at" timestamptz
);

-- Create the conversations table
CREATE TABLE "public"."conversations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "participant_one_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "participant_two_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "last_message_at" timestamptz,
    UNIQUE(participant_one_id, participant_two_id)
);

-- Create the messages table
CREATE TABLE "public"."messages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" uuid NOT NULL REFERENCES "public"."conversations"(id) ON DELETE CASCADE,
    "sender_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "receiver_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "content" text NOT NULL,
    "is_read" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT now()
);


-- ========= RLS (Row Level Security) Policies =========

-- Enable RLS for all relevant tables
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."agreements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

-- Policies for 'users'
CREATE POLICY "Allow public read access to all users" ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Allow users to insert their own profile" ON "public"."users" FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON "public"."users" FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for 'providers'
CREATE POLICY "Allow public read access to providers" ON "public"."providers" FOR SELECT USING (true);
CREATE POLICY "Allow providers to insert their own data" ON "public"."providers" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow providers to update their own data" ON "public"."providers" FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for 'customers'
CREATE POLICY "Allow customers to insert their own data" ON "public"."customers" FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for 'reviews'
CREATE POLICY "Allow public read access to reviews" ON "public"."reviews" FOR SELECT USING (true);
CREATE POLICY "Allow customers to insert reviews" ON "public"."reviews" FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Policies for 'agreements'
CREATE POLICY "Allow involved users to view their agreements" ON "public"."agreements" FOR SELECT USING (
    provider_phone = (SELECT phone FROM public.users WHERE id = auth.uid()) OR
    customer_phone = (SELECT phone FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Allow customers to create agreements" ON "public"."agreements" FOR INSERT WITH CHECK (customer_phone = (SELECT phone FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Allow providers to update agreements (confirm)" ON "public"."agreements" FOR UPDATE USING (provider_phone = (SELECT phone FROM public.users WHERE id = auth.uid()));

-- Policies for 'conversations'
CREATE POLICY "Allow participants to view their conversations" ON "public"."conversations" FOR SELECT USING (
    auth.uid() = participant_one_id OR auth.uid() = participant_two_id
);

-- Policies for 'messages'
CREATE POLICY "Allow participants to view messages in their conversations" ON "public"."messages" FOR SELECT USING (
    (SELECT conversations.id FROM conversations WHERE conversations.id = messages.conversation_id AND (conversations.participant_one_id = auth.uid() OR conversations.participant_two_id = auth.uid())) IS NOT NULL
);
CREATE POLICY "Allow participants to send messages" ON "public"."messages" FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    (SELECT conversations.id FROM conversations WHERE conversations.id = messages.conversation_id AND (conversations.participant_one_id = auth.uid() OR conversations.participant_two_id = auth.uid())) IS NOT NULL
);
CREATE POLICY "Allow receivers to mark messages as read" ON "public"."messages" FOR UPDATE USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());
