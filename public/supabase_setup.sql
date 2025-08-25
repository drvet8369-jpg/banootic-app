-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('provider', 'customer')),
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name VARCHAR(255) UNIQUE NOT NULL,
    service TEXT,
    location TEXT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    bio TEXT,
    category_slug VARCHAR(255),
    service_slug VARCHAR(255),
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB[]
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name VARCHAR(255),
    phone VARCHAR(20) UNIQUE NOT NULL
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id SERIAL PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_phone VARCHAR(20) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(provider_id, customer_id) -- Ensures a customer can only request an agreement once per provider
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can see their own data
CREATE POLICY "Users can view their own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Allow anonymous access to read the users table (for login checks)
CREATE POLICY "Allow anonymous read access to users" ON users
FOR SELECT TO anon USING (true);

-- Providers can be seen by anyone
CREATE POLICY "Providers are publicly visible" ON providers
FOR SELECT USING (true);
-- Providers can insert their own profile
CREATE POLICY "Providers can insert their own profile" ON providers
FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Providers can update their own profile
CREATE POLICY "Providers can update their own profile" ON providers
FOR UPDATE USING (auth.uid() = user_id);

-- Customers can be seen by anyone (e.g., for providers to see who they are)
CREATE POLICY "Customers are publicly visible" ON customers
FOR SELECT USING (true);
-- Customers can insert their own profile
CREATE POLICY "Customers can insert their own profile" ON customers
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reviews can be seen by anyone
CREATE POLICY "Reviews are publicly visible" ON reviews
FOR SELECT USING (true);
-- Authenticated users can insert reviews
CREATE POLICY "Authenticated users can create reviews" ON reviews
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Agreements can be seen by the provider or the customer
CREATE POLICY "Agreements are visible to involved parties" ON agreements
FOR SELECT USING (EXISTS (
    SELECT 1 FROM providers WHERE providers.user_id = auth.uid() AND providers.phone = agreements.provider_phone
) OR EXISTS (
    SELECT 1 FROM customers WHERE customers.user_id = auth.uid() AND customers.phone = agreements.customer_phone
));
-- Customers can create agreements
CREATE POLICY "Customers can create agreements" ON agreements
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.phone = agreements.customer_phone
));
-- Providers can update (confirm) agreements
CREATE POLICY "Providers can confirm agreements" ON agreements
FOR UPDATE USING (EXISTS (
    SELECT 1 FROM providers WHERE providers.user_id = auth.uid() AND providers.phone = agreements.provider_phone
)) WITH CHECK (status = 'confirmed');

-- Messages can be seen by sender or receiver
CREATE POLICY "Messages are visible to sender or receiver" ON messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages" ON messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Profile images are publicly accessible." ON storage.objects
FOR SELECT USING ( bucket_id = 'images' );

CREATE POLICY "Anyone can upload a profile image." ON storage.objects
FOR INSERT WITH CHECK ( bucket_id = 'images' );

CREATE POLICY "Anyone can update their own profile image." ON storage.objects
FOR UPDATE USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'images' );


-- Create Database Functions

-- Function to get user login details from either providers or customers table.
CREATE OR REPLACE FUNCTION get_user_login_details(p_phone TEXT)
RETURNS TABLE (id UUID, name VARCHAR, phone VARCHAR, account_type VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.phone, u.account_type
    FROM users u
    WHERE u.phone = p_phone
    LIMIT 1;
END;
$$;


-- Function to get all conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    chat_id TEXT,
    other_user_id UUID,
    other_user_name VARCHAR,
    other_user_avatar TEXT,
    other_user_phone VARCHAR,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
        SELECT 
            m.*,
            ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    )
    SELECT
        rm.chat_id,
        (CASE WHEN rm.sender_id = p_user_id THEN rm.receiver_id ELSE rm.sender_id END) AS other_user_id,
        ou.name AS other_user_name,
        COALESCE(op.profile_image->>'src', oc.profile_image->>'src') AS other_user_avatar,
        ou.phone as other_user_phone,
        rm.content AS last_message_content,
        rm.created_at AS last_message_at
    FROM ranked_messages rm
    JOIN users ou ON ou.id = (CASE WHEN rm.sender_id = p_user_id THEN rm.receiver_id ELSE rm.sender_id END)
    LEFT JOIN providers op ON op.user_id = ou.id
    LEFT JOIN customers oc ON oc.user_id = ou.id
    WHERE rm.rn = 1
    ORDER BY rm.created_at DESC;
END;
$$;
