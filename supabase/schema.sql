-- Create the providers table
CREATE TABLE if not exists providers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    service TEXT NOT NULL,
    location TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    bio TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    service_slug TEXT NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    profile_image JSONB,
    portfolio JSONB
);

-- Create the reviews table
CREATE TABLE if not exists reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL
);

-- Create the agreements table
CREATE TABLE if not exists agreements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_phone TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (read-only)
-- Anyone can read provider and review data.
CREATE POLICY "Allow public read access to providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to reviews" ON reviews FOR SELECT USING (true);

-- Policies for data modification (requires authentication, which is not fully set up here but good practice)
-- In a real app, you would lock this down to authenticated users, e.g., using auth.uid() = user_id
-- For now, we'll allow broader access for simplicity of the demo app.
CREATE POLICY "Allow all access to agreements" ON agreements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert for all users" ON providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all users" ON providers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert for all users" ON reviews FOR INSERT WITH CHECK (true);

-- Create an index on provider_id in reviews table for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);

-- Create an index on phone in providers table for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_phone ON providers(phone);

-- Create indexes on agreements table
CREATE INDEX IF NOT EXISTS idx_agreements_provider_phone ON agreements(provider_phone);
CREATE INDEX IF NOT EXISTS idx_agreements_customer_phone ON agreements(customer_phone);
