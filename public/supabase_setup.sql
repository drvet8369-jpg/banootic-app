-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('customer', 'provider'))
);

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    service VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    phone VARCHAR(20) NOT NULL UNIQUE,
    bio TEXT,
    category_slug VARCHAR(100),
    service_slug VARCHAR(100),
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB[]
);
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    author_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT
);

-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id BIGSERIAL PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    provider_phone VARCHAR(20) NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE (provider_id, customer_id) -- Ensures a customer can only request an agreement once per provider
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- RLS Policies
-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;


-- Policies for 'users' table
-- Allow anonymous read access to users table for login check
CREATE POLICY "Allow anonymous read access to users" ON users
  FOR SELECT
  USING (true);

-- Users can view their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policies for 'providers' table
-- Allow public read access to all providers
CREATE POLICY "Allow public read access to providers" ON providers
  FOR SELECT
  USING (true);

-- Allow provider to update their own profile
CREATE POLICY "Providers can update their own profile" ON providers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for 'customers' table
-- Allow public read access
CREATE POLICY "Allow public read access to customers" ON customers
  FOR SELECT
  USING (true);

-- Policies for 'reviews' table
-- Allow public read access to all reviews
CREATE POLICY "Allow public read access to reviews" ON reviews
  FOR SELECT
  USING (true);
-- Allow authenticated users to insert reviews
CREATE POLICY "Authenticated users can insert reviews" ON reviews
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policies for 'agreements' table
-- Allow providers to read agreements where they are the provider
CREATE POLICY "Providers can read their agreements" ON agreements
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM providers WHERE providers.user_id = auth.uid() AND providers.phone = agreements.provider_phone));

-- Allow customers to read agreements they have created
CREATE POLICY "Customers can read their agreements" ON agreements
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Allow authenticated users (customers) to create agreements
CREATE POLICY "Customers can create agreements" ON agreements
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id AND auth.role() = 'authenticated');

-- Allow providers to update (confirm) their agreements
CREATE POLICY "Providers can update their agreements" ON agreements
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM providers WHERE providers.user_id = auth.uid() AND providers.phone = agreements.provider_phone));


-- Policies for 'messages' table
-- Allow users to see messages where they are the sender or receiver
CREATE POLICY "Users can read their own messages" ON messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Allow users to send messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);


-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_providers_phone ON providers(phone);
CREATE INDEX IF NOT EXISTS idx_providers_service_slug ON providers(service_slug);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_agreements_provider_phone ON agreements(provider_phone);
CREATE INDEX IF NOT EXISTS idx_agreements_customer_phone ON agreements(customer_phone);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);


-- Function to get conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    chat_id TEXT,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_avatar TEXT,
    other_user_phone TEXT,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
      SELECT *,
             ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
      FROM messages m
      WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    )
    SELECT
        rm.chat_id,
        CASE
            WHEN rm.sender_id = p_user_id THEN rm.receiver_id
            ELSE rm.sender_id
        END AS other_user_id,
        u.name AS other_user_name,
        p.profile_image->>'src' as other_user_avatar,
        u.phone as other_user_phone,
        rm.content AS last_message_content,
        rm.created_at AS last_message_at
    FROM ranked_messages rm
    JOIN users u ON u.id = (CASE WHEN rm.sender_id = p_user_id THEN rm.receiver_id ELSE rm.sender_id END)
    LEFT JOIN providers p ON p.user_id = u.id
    WHERE rm.rn = 1
    ORDER BY rm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get user login details from both providers and customers
CREATE OR REPLACE FUNCTION get_user_login_details(p_phone VARCHAR)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone VARCHAR,
    account_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.phone, u.account_type
    FROM users u
    WHERE u.phone = p_phone
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
