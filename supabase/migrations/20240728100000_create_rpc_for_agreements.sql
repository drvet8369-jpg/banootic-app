-- supabase/migrations/20240728100000_create_rpc_for_agreements.sql

-- Drop the old function if it exists, to ensure a clean slate
DROP FUNCTION IF EXISTS public.get_customer_agreements(p_customer_phone text);

-- Create a secure function to get agreements for the currently logged-in customer
CREATE OR REPLACE FUNCTION public.get_customer_agreements(p_customer_phone text)
RETURNS SETOF agreements
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- The function now correctly uses the snake_case column name 'customer_phone'
  SELECT * FROM public.agreements as a
  WHERE a.customer_phone = p_customer_phone;
$$;

-- Grant permission to authenticated users to execute this function
GRANT EXECUTE ON FUNCTION public.get_customer_agreements(p_customer_phone text) TO authenticated;
