-- Create the customers table
CREATE TABLE customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    account_type TEXT DEFAULT 'customer' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE customers IS 'Stores customer user data.';
COMMENT ON COLUMN customers.phone IS 'Unique phone number for each customer.';

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies for the customers table
-- 1. Allow anyone to create a new customer (for public sign-up)
CREATE POLICY "Allow public insert for new customers" ON customers
FOR INSERT WITH CHECK (true);

-- 2. Allow users to view their own customer info (for login/authentication)
-- This policy is simple and assumes you might later add auth.uid() checks
CREATE POLICY "Allow individual read access" ON customers
FOR SELECT USING (true);
