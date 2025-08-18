-- supabase/migrations/20240730100000_enable_customer_inserts.sql

-- First, enable Row Level Security (RLS) on the customers table if it's not already enabled.
-- This is a prerequisite for creating policies.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it already exists to ensure this migration can be re-run without errors.
DROP POLICY IF EXISTS "Allow public inserts for customers" ON public.customers;

-- Create a new policy that allows any user (including anonymous users who are signing up)
-- to insert a new row into the customers table. This is essential for the registration to work.
CREATE POLICY "Allow public inserts for customers"
ON public.customers
FOR INSERT
WITH CHECK (true);
