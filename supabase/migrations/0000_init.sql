-- Honarbanoo Initial Schema
-- This script resets and defines the entire database schema.
-- Version: 1.5 - Final Cascade & Timestamp Fix

-- Section 1: Complete Teardown of Existing Schema
-- Drops all tables in the correct dependency order to ensure a clean reset.
-- The use of CASCADE handles all related objects like foreign keys and policies.

DROP TABLE IF EXISTS "public"."reviews" CASCADE;
DROP TABLE IF EXISTS "public"."messages" CASCADE;
DROP TABLE IF EXISTS "public"."conversations" CASCADE;
DROP TABLE IF EXISTS "public"."agreements" CASCADE;
DROP TABLE IF EXISTS "public"."providers" CASCADE;
DROP TABLE IF EXISTS "public"."customers" CASCADE;
DROP TABLE IF EXISTS "public"."users" CASCADE;

-- Section 2: Rebuilding the Schema from Scratch

-- Table for all users (both customers and providers)
-- This table is linked to the auth.users table.
CREATE TABLE "public"."users" (
    "id" uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "name" text NOT NULL,
    "phone" text NOT NULL UNIQUE,
    "account_type" text NOT NULL CHECK (account_type IN ('customer', 'provider')),
    "profile_image" jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- Table for providers, extending the users table with provider-specific details.
CREATE TABLE "public"."providers" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "user_id" uuid NOT NULL UNIQUE REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "name" text NOT NULL,
    "phone" text NOT NULL UNIQUE,
    "service" text NOT NULL,
    "location" text NOT NULL,
    "bio" text NOT NULL,
    "category_slug" text NOT NULL,
    "service_slug" text NOT NULL,
    "rating" real NOT NULL DEFAULT 0,
    "reviews_count" integer NOT NULL DEFAULT 0,
    "profile_image" jsonb,
    "portfolio" jsonb[] DEFAULT '{}'::jsonb[],
    "created_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers are viewable by everyone." ON providers FOR SELECT USING (true);
CREATE POLICY "Providers can insert their own profile." ON providers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type = 'provider'));
CREATE POLICY "Providers can update their own profile." ON providers FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.id = providers.user_id AND users.account_type = 'provider')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.id = providers.user_id AND users.account_type = 'provider'));


-- Table for customers, mainly for potential customer-specific data in the future.
CREATE TABLE "public"."customers" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "user_id" uuid NOT NULL UNIQUE REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "created_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view their own profile." ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can insert their own profile." ON customers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.account_type = 'customer'));


-- Table for service agreements between customers and providers.
CREATE TABLE "public"."agreements" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "customer_phone" text NOT NULL,
    "provider_phone" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    "requested_at" timestamptz NOT NULL DEFAULT now(),
    "confirmed_at" timestamptz
);
ALTER TABLE "public"."agreements" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agreements." ON agreements FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND (users.phone = agreements.customer_phone OR users.phone = agreements.provider_phone)));
CREATE POLICY "Customers can create agreements." ON agreements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.phone = agreements.customer_phone AND users.account_type = 'customer'));
CREATE POLICY "Providers can update status to confirm." ON agreements FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.phone = agreements.provider_phone AND users.account_type = 'provider')) WITH CHECK (status = 'confirmed');


-- Table for conversations between two users.
CREATE TABLE "public"."conversations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "participant_one_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "participant_two_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "last_message_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    UNIQUE(participant_one_id, participant_two_id)
);
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view conversations they are part of." ON conversations FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);
CREATE POLICY "Users can create conversations they are part of." ON conversations FOR INSERT WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);


-- Table for individual chat messages within a conversation.
CREATE TABLE "public"."messages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" uuid NOT NULL REFERENCES "public"."conversations"(id) ON DELETE CASCADE,
    "sender_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "receiver_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "content" text NOT NULL,
    "is_read" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations." ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id));
CREATE POLICY "Users can send messages." ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages they received as read." ON messages FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (is_read = true);


-- Table for reviews given by customers to providers.
CREATE TABLE "public"."reviews" (
    "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "provider_id" bigint NOT NULL REFERENCES "public"."providers"(id) ON DELETE CASCADE,
    "customer_id" uuid NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "customer_name" text NOT NULL,
    "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    UNIQUE(provider_id, customer_id)
);
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public." ON reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews." ON reviews FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.id = reviews.customer_id AND users.account_type = 'customer'));


-- Section 3: Functions and Triggers
-- This section defines database functions and triggers for automatic operations.

-- Function to get or create a conversation between two users.
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_id_1 uuid, p_user_id_2 uuid)
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    participant_one_id uuid,
    participant_two_id uuid,
    last_message_at timestamptz
) AS $$
DECLARE
    v_conversation_id uuid;
BEGIN
    -- Ensure consistent ordering of participants to avoid duplicate conversations
    IF p_user_id_1 > p_user_id_2 THEN
        -- Swap variables
        SELECT p_user_id_2, p_user_id_1 INTO p_user_id_1, p_user_id_2;
    END IF;

    -- Check if a conversation already exists
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.participant_one_id = p_user_id_1 AND c.participant_two_id = p_user_id_2;

    -- If no conversation exists, create a new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participant_one_id, participant_two_id)
        VALUES (p_user_id_1, p_user_id_2)
        RETURNING conversations.id INTO v_conversation_id;
    END IF;

    -- Return the conversation details
    RETURN QUERY
    SELECT c.id, c.created_at, c.participant_one_id, c.participant_two_id, c.last_message_at
    FROM public.conversations c
    WHERE c.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql;


-- Function to get metadata for all conversations of a user.
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
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id
    ),
    unread_counts AS (
        SELECT
            m.conversation_id,
            count(*) as unread
        FROM messages m
        WHERE m.receiver_id = user_id AND m.is_read = false
        GROUP BY m.conversation_id
    )
    SELECT
        c.id,
        lm.content,
        COALESCE(uc.unread, 0)
    FROM conversations c
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
    WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id;
END;
$$ LANGUAGE plpgsql;


-- Trigger to update the last_message_at timestamp in conversations table.
CREATE OR REPLACE FUNCTION update_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_last_message_at();


-- Trigger function to recalculate provider rating and reviews count.
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  WITH stats AS (
    SELECT
      AVG(rating) as avg_rating,
      COUNT(*) as reviews_count
    FROM reviews
    WHERE provider_id = COALESCE(NEW.provider_id, OLD.provider_id)
  )
  UPDATE providers
  SET
    rating = COALESCE(stats.avg_rating, 0),
    reviews_count = COALESCE(stats.reviews_count, 0)
  FROM stats
  WHERE id = COALESCE(NEW.provider_id, OLD.provider_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_provider_rating();

-- Section 4: Final Permissions
-- Grant usage on the public schema to authenticated users.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable real-time for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages, conversations, agreements;


-- Final confirmation message
SELECT 'Honarbanoo schema setup complete.' as status;
