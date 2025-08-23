-- Create the customers table to store non-provider user information.
CREATE TABLE
  customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

-- Enable RLS for the new customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies for the customers table

-- 1. Allow users to view their own customer profile.
CREATE POLICY "Customers can view their own profile" ON customers FOR
SELECT
  USING (auth.uid () = user_id);

-- 2. Allow users to create their own customer profile.
-- The user_id must match the currently authenticated user.
CREATE POLICY "Users can create their own customer profile" ON customers FOR INSERT
WITH
  CHECK (auth.uid () = user_id);

-- 3. Allow authenticated users to view any customer's public data.
-- This is useful for cases where a provider might need to see a customer's name.
CREATE POLICY "Authenticated users can view customer profiles" ON customers FOR
SELECT
  USING (auth.role () = 'authenticated');
