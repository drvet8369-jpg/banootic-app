
-- Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    account_type text NOT NULL DEFAULT 'customer'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.customers IS 'Stores customer user data.';
COMMENT ON COLUMN public.customers.name IS 'Full name of the customer.';
COMMENT ON COLUMN public.customers.phone IS 'Unique phone number for the customer, used for login.';
COMMENT ON COLUMN public.customers.account_type IS 'The type of user account, always ''customer''.';


-- Enable Row Level Security (RLS) for the customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to create a new customer (for registration)
CREATE POLICY "Allow public inserts for customers"
ON public.customers
FOR INSERT
WITH CHECK (true);

-- Create a policy that allows anyone to read customer data (for login checks)
CREATE POLICY "Enable read access for all users"
ON public.customers
FOR SELECT
USING (true);
