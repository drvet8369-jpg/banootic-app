-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('customer', 'provider')),
    phone VARCHAR(20) UNIQUE NOT NULL
);

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR(255) UNIQUE NOT NULL,
    service VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    bio TEXT,
    category_slug VARCHAR(100),
    service_slug VARCHAR(100),
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id VARCHAR(255) NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id BIGSERIAL PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_phone VARCHAR(20) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(provider_id, customer_id)
);


-- Function to get user conversations
-- Drop the function only if it exists, before creating it again.
DROP FUNCTION IF EXISTS get_user_conversations(p_user_id UUID);
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    chat_id TEXT,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_avatar TEXT,
    other_user_phone TEXT,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT
            m.chat_id,
            m.content,
            m.created_at,
            m.sender_id,
            m.receiver_id,
            ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    )
    SELECT
        lm.chat_id,
        (CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END) AS other_user_id,
        u.name AS other_user_name,
        COALESCE(p.profile_image->>'src', c.profile_image->>'src') AS other_user_avatar,
        u.phone AS other_user_phone,
        lm.content AS last_message_content,
        lm.created_at AS last_message_at
    FROM last_messages lm
    JOIN users u ON u.id = (CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END)
    LEFT JOIN providers p ON p.user_id = u.id
    LEFT JOIN customers c ON c.user_id = u.id
    WHERE lm.rn = 1
    ORDER BY lm.created_at DESC;
END;
$$;

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Policies for USERS table
-- THIS IS THE NEW, CRITICAL POLICY FOR LOGIN
CREATE POLICY "Allow anon read access to users" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow individual users to see their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own info" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies for PROVIDERS table
CREATE POLICY "Allow public read access to providers" ON providers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow provider to update their own profile" ON providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to create a provider profile" ON providers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policies for CUSTOMERS table
CREATE POLICY "Allow customer to update their own profile" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to create a customer profile" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policies for REVIEWS table
CREATE POLICY "Allow public read access to reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Policies for MESSAGES table
CREATE POLICY "Allow users to see their own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Allow users to send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policies for AGREEMENTS table
CREATE POLICY "Allow users to see agreements they are part of" ON agreements FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = (SELECT user_id FROM providers WHERE phone = provider_phone));
CREATE POLICY "Allow customers to create agreements" ON agreements FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Allow providers to update (confirm) agreements" ON agreements FOR UPDATE USING (auth.uid() = (SELECT user_id FROM providers WHERE phone = provider_phone));
