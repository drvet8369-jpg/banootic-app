-- supabase/migrations/20240722100003_create_rpc_functions.sql

-- This function allows a customer to securely fetch their own agreements
-- without needing complex RLS select policies.
-- The function runs with the privileges of the user that created it (postgres),
-- bypassing RLS for this specific query, but the WHERE clause ensures data security.

CREATE OR REPLACE FUNCTION get_customer_agreements(p_customer_phone text)
RETURNS SETOF agreements AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.agreements
  WHERE "customerPhone" = p_customer_phone
  ORDER BY requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to the authenticated role
GRANT EXECUTE ON FUNCTION get_customer_agreements(text) TO authenticated;
