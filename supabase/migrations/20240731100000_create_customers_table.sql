
-- Create the customers table
CREATE TABLE customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    account_type TEXT NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to create a new customer (for registration)
CREATE POLICY "Allow public inserts for customers"
ON customers
FOR INSERT
WITH CHECK (true);

-- Create policy to allow anyone to read customer data (for login and profile fetching)
CREATE POLICY "Enable read access for all users"
ON customers
FOR SELECT
USING (true);
