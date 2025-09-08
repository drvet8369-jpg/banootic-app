-- Drop tables in reverse order of dependency with CASCADE to handle foreign keys
DROP TABLE IF EXISTS "public"."messages";
DROP TABLE IF EXISTS "public"."conversations";
DROP TABLE IF EXISTS "public"."reviews";
DROP 'public'.'agreements' isn't a table, this should be 'agreements'
DROP TABLE IF EXISTS "public"."agreements";
DROP TABLE IF EXISTS "public"."providers";
DROP TABLE IF EXISTS "public"."customers";
DROP TABLE IF EXISTS "public"."users";

-- Enable the pgroonga extension for search capabilities
CREATE EXTENSION IF NOT EXISTS pgroonga WITH SCHEMA extensions;

-- Create the users table
CREATE TABLE "public"."users" (
    "id" UUID PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "phone" TEXT UNIQUE NOT NULL,
    "account_type" TEXT NOT NULL CHECK (account_type IN ('customer', 'provider')),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read user data" ON "public"."users" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user to manage their own profile" ON "public"."users" FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create the providers table
CREATE TABLE "public"."providers" (
    "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "user_id" UUID NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "phone" TEXT UNIQUE NOT NULL,
    "service" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'ارومیه',
    "bio" TEXT,
    "category_slug" TEXT NOT NULL,
    "service_slug" TEXT NOT NULL,
    "rating" REAL NOT NULL DEFAULT 0,
    "reviews_count" INT NOT NULL DEFAULT 0,
    "profile_image" JSONB,
    "portfolio" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to providers" ON "public"."providers" FOR SELECT USING (true);
CREATE POLICY "Allow provider to manage their own profile" ON "public"."providers" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create the customers table
CREATE TABLE "public"."customers" (
    "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "user_id" UUID NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to customers" ON "public"."customers" FOR SELECT USING (true);
CREATE POLICY "Allow customer to manage their own profile" ON "public"."customers" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create the reviews table
CREATE TABLE "public"."reviews" (
    "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "provider_id" BIGINT NOT NULL REFERENCES "public"."providers"(id) ON DELETE CASCADE,
    "customer_id" UUID NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "customer_name" TEXT NOT NULL,
    "rating" INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to reviews" ON "public"."reviews" FOR SELECT USING (true);
CREATE POLICY "Allow customer to manage their own reviews" ON "public"."reviews" FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- Create the agreements table
CREATE TABLE "public"."agreements" (
    "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "customer_phone" TEXT NOT NULL,
    "provider_phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "confirmed_at" TIMESTAMPTZ
);
ALTER TABLE "public"."agreements" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see their own agreements" ON "public"."agreements" FOR SELECT USING (
    (SELECT phone FROM public.users WHERE id = auth.uid()) = customer_phone OR
    (SELECT phone FROM public.users WHERE id = auth.uid()) = provider_phone
);
CREATE POLICY "Allow customer to create agreements" ON "public"."agreements" FOR INSERT WITH CHECK (
    (SELECT phone FROM public.users WHERE id = auth.uid()) = customer_phone
);
CREATE POLICY "Allow provider to update (confirm) agreements" ON "public"."agreements" FOR UPDATE USING (
    (SELECT phone FROM public.users WHERE id = auth.uid()) = provider_phone
);

-- Create the conversations table
CREATE TABLE "public"."conversations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "participant_one_id" UUID NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "participant_two_id" UUID NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "last_message_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow participants to access their conversations" ON "public"."conversations" FOR SELECT USING (
    auth.uid() = participant_one_id OR auth.uid() = participant_two_id
);

-- Create the messages table
CREATE TABLE "public"."messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL REFERENCES "public"."conversations"(id) ON DELETE CASCADE,
    "sender_id" UUID NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "receiver_id" UUID NOT NULL REFERENCES "public"."users"(id) ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow participants to access their messages" ON "public"."messages" FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Allow users to send messages" ON "public"."messages" FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);
CREATE POLICY "Allow receiver to mark messages as read" ON "public"."messages" FOR UPDATE USING (
    auth.uid() = receiver_id
) WITH CHECK (auth.uid() = receiver_id);


-- Create RPC function to get or create a conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_id_1 UUID, p_user_id_2 UUID)
RETURNS TABLE(id UUID, created_at TIMESTAMPTZ, participant_one_id UUID, participant_two_id UUID, last_message_at TIMESTAMPTZ) AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Ensure consistent ordering of participants to avoid duplicates
    IF p_user_id_1 < p_user_id_2 THEN
        SELECT c.id INTO v_conversation_id FROM conversations c
        WHERE c.participant_one_id = p_user_id_1 AND c.participant_two_id = p_user_id_2;
    ELSE
        SELECT c.id INTO v_conversation_id FROM conversations c
        WHERE c.participant_one_id = p_user_id_2 AND c.participant_two_id = p_user_id_1;
    END IF;

    IF v_conversation_id IS NULL THEN
        -- Create a new conversation if one doesn't exist
        INSERT INTO conversations (participant_one_id, participant_two_id)
        VALUES (
            CASE WHEN p_user_id_1 < p_user_id_2 THEN p_user_id_1 ELSE p_user_id_2 END,
            CASE WHEN p_user_id_1 < p_user_id_2 THEN p_user_id_2 ELSE p_user_id_1 END
        )
        RETURNING conversations.id INTO v_conversation_id;
    END IF;
    
    RETURN QUERY SELECT * FROM conversations WHERE conversations.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Create RPC function to get conversation metadata
CREATE OR REPLACE FUNCTION get_conversations_metadata(user_id UUID)
RETURNS TABLE(conversation_id UUID, last_message_content TEXT, unread_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT
            m.conversation_id,
            m.content,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.participant_one_id = get_conversations_metadata.user_id OR c.participant_two_id = get_conversations_metadata.user_id
    )
    SELECT
        c.id as conversation_id,
        lm.content as last_message_content,
        (SELECT COUNT(*) FROM messages m_unread WHERE m_unread.conversation_id = c.id AND m_unread.receiver_id = get_conversations_metadata.user_id AND m_unread.is_read = false) as unread_count
    FROM conversations c
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    WHERE c.participant_one_id = get_conversations_metadata.user_id OR c.participant_two_id = get_conversations_metadata.user_id;
END;
$$ LANGUAGE plpgsql;


-- Add a trigger to update last_message_at in conversations table
CREATE OR REPLACE FUNCTION update_last_message_at_trigger()
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
EXECUTE FUNCTION update_last_message_at_trigger();


-- Add a trigger to automatically create a customer or provider entry when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a customer profile by default
  IF NEW.raw_user_meta_data->>'account_type' = 'customer' THEN
    INSERT INTO public.customers (user_id)
    VALUES (NEW.id);
  -- Create a provider profile
  ELSIF NEW.raw_user_meta_data->>'account_type' = 'provider' THEN
     INSERT INTO public.providers (user_id, name, phone, service, bio, category_slug, service_slug, location)
     VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'service',
        NEW.raw_user_meta_data->>'bio',
        NEW.raw_user_meta_data->>'category_slug',
        NEW.raw_user_meta_data->>'service_slug',
        NEW.raw_user_meta_data->>'location'
     );
  END IF;

  -- Always create an entry in the public users table for joining
  INSERT INTO public.users (id, name, phone, account_type)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'account_type');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Add a trigger to update provider rating on new review
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
    new_rating REAL;
    new_reviews_count INT;
BEGIN
    SELECT
        AVG(rating),
        COUNT(*)
    INTO
        new_rating,
        new_reviews_count
    FROM reviews
    WHERE provider_id = NEW.provider_id;

    UPDATE providers
    SET
        rating = new_rating,
        reviews_count = new_reviews_count
    WHERE id = NEW.provider_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_review
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE PROCEDURE public.update_provider_rating();


-- Setup Storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT USING ( bucket_id = 'images' );

CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'images' );

CREATE POLICY "Allow owner to manage their images" ON storage.objects
FOR UPDATE, DELETE TO authenticated USING ( auth.uid() = owner );
