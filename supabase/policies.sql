-- Enable Row Level Security for the customers table if it's not already enabled.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop any existing select policy for the customers table to ensure a clean slate.
DROP POLICY IF EXISTS "Allow read access to all users" ON public.customers;

-- Create a new policy that allows any user (authenticated or not) to read
-- data from the customers table. This is necessary for the login page to check
-- if a customer already exists before creating a new one. This policy is safe
-- because the customers table does not contain sensitive private data.
CREATE POLICY "Allow read access to all users"
ON public.customers
FOR SELECT
TO public
USING (true);
