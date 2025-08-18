-- Create the customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    account_type TEXT NOT NULL DEFAULT 'customer'
);

-- Add comments to the table and columns
COMMENT ON TABLE customers IS 'Stores customer user data.';
COMMENT ON COLUMN customers.name IS 'The full name of the customer.';
COMMENT ON COLUMN customers.phone IS 'The unique phone number for the customer, used for login.';
COMMENT ON COLUMN customers.account_type IS 'The type of account, always "customer".';

-- Enable Row Level Security (RLS) for the customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to create a new customer (sign up)
CREATE POLICY "Allow public inserts for new customers" ON customers
FOR INSERT
WITH CHECK (TRUE);

-- Create a policy to allow anyone to read customer data (for login checks)
CREATE POLICY "Enable read access for all users" ON customers
FOR SELECT
USING (TRUE);
