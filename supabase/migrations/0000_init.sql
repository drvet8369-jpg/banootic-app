-- Create the users table, storing public user information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    account_type TEXT NOT NULL CHECK (account_type IN ('customer', 'provider')),
    profile_image JSONB, -- { "src": "url", "ai_hint": "..." }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the providers table
CREATE TABLE IF NOT EXISTS providers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    service TEXT NOT NULL,
    location TEXT NOT NULL,
    bio TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    service_slug TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 0,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the agreements table with the CORRECTED defaults
CREATE TABLE IF NOT EXISTS agreements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_phone TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(provider_phone, customer_phone)
);

-- Create the conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    participant_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    UNIQUE(participant_one_id, participant_two_id)
);

-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for USERS
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies for PROVIDERS
CREATE POLICY "Allow public read access to providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Allow provider to update their own profile" ON providers FOR UPDATE USING (auth.uid() = user_id);

-- Policies for REVIEWS
CREATE POLICY "Allow public read access to reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- Policies for AGREEMENTS
CREATE POLICY "Allow public read access to agreements" ON agreements FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create agreements" ON agreements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow provider to update their own agreement" ON agreements FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.phone = agreements.provider_phone));

-- Policies for CONVERSATIONS
CREATE POLICY "Allow users to see their own conversations" ON conversations FOR SELECT USING (auth.uid() IN (participant_one_id, participant_two_id));

-- Policies for MESSAGES
CREATE POLICY "Allow users to see messages in their conversations" ON messages FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "Allow users to send messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Allow receiver to mark message as read" ON messages FOR UPDATE USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- Create a function to update the provider's average rating
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE providers
    SET
        rating = (SELECT AVG(rating) FROM reviews WHERE provider_id = NEW.provider_id),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id)
    WHERE id = NEW.provider_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function after a new review is inserted
CREATE TRIGGER on_new_review
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_provider_rating();

-- Function to update last_message_at in conversations table
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function after a new message is inserted
CREATE TRIGGER on_new_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- RPC function to get or create a conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_id_1 UUID, p_user_id_2 UUID)
RETURNS TABLE(id UUID, created_at TIMESTAMPTZ, participant_one_id UUID, participant_two_id UUID, last_message_at TIMESTAMPTZ) AS $$
DECLARE
    v_conversation_id UUID;
    v_ordered_user_id_1 UUID;
    v_ordered_user_id_2 UUID;
BEGIN
    -- Ensure consistent ordering of participants to use the UNIQUE constraint
    IF p_user_id_1 < p_user_id_2 THEN
        v_ordered_user_id_1 := p_user_id_1;
        v_ordered_user_id_2 := p_user_id_2;
    ELSE
        v_ordered_user_id_1 := p_user_id_2;
        v_ordered_user_id_2 := p_user_id_1;
    END IF;

    -- Attempt to find an existing conversation
    SELECT c.id INTO v_conversation_id
    FROM conversations c
    WHERE (c.participant_one_id = v_ordered_user_id_1 AND c.participant_two_id = v_ordered_user_id_2);

    -- If not found, create a new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (participant_one_id, participant_two_id)
        VALUES (v_ordered_user_id_1, v_ordered_user_id_2)
        RETURNING conversations.id INTO v_conversation_id;
    END IF;

    -- Return the found or newly created conversation
    RETURN QUERY SELECT * FROM conversations WHERE conversations.id = v_conversation_id;
END;
$$ LANGUAGE plpgsql;


-- RPC Function to get metadata for all conversations for a user
CREATE OR REPLACE FUNCTION get_conversations_metadata(user_id UUID)
RETURNS TABLE (
    conversation_id UUID,
    last_message_content TEXT,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT
            m.conversation_id,
            m.content,
            ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.conversation_id IN (SELECT c.id FROM conversations c WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id)
    )
    SELECT
        c.id as conversation_id,
        lm.content as last_message_content,
        (
            SELECT COUNT(*)
            FROM messages msg
            WHERE msg.conversation_id = c.id
            AND msg.receiver_id = user_id
            AND msg.is_read = false
        ) as unread_count
    FROM conversations c
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get a ranked list of providers
CREATE OR REPLACE FUNCTION get_ranked_providers(p_query TEXT)
RETURNS TABLE(
    id BIGINT,
    user_id UUID,
    name TEXT,
    phone TEXT,
    service TEXT,
    location TEXT,
    bio TEXT,
    category_slug TEXT,
    service_slug TEXT,
    rating REAL,
    reviews_count INTEGER,
    profile_image JSONB,
    portfolio JSONB[],
    created_at TIMESTAMPTZ,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH provider_scores AS (
        SELECT 
            p.id,
            -- Calculate a relevance score based on the query
            ts_rank(
                to_tsvector('simple', p.name) || 
                to_tsvector('simple', p.service) || 
                to_tsvector('simple', p.bio), 
                websearch_to_tsquery('simple', p_query)
            ) as relevance,
            -- Calculate a quality score
            (p.rating * 10) + p.reviews_count + (
                SELECT COUNT(*) FROM agreements a WHERE a.provider_phone = p.phone AND a.status = 'confirmed'
            ) * 5 as quality_score
        FROM providers p
    )
    SELECT 
        p.*,
        ROW_NUMBER() OVER (ORDER BY (ps.relevance * 2) + ps.quality_score DESC, p.created_at DESC) as rank
    FROM providers p
    JOIN provider_scores ps ON p.id = ps.id
    ORDER BY rank;
END;
$$ LANGUAGE plpgsql;
