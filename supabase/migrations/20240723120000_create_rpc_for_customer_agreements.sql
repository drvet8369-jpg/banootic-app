-- Create the RPC function to securely fetch agreements for the calling customer.
-- The SECURITY DEFINER clause makes the function run with the permissions of the user who defined it (the admin),
-- bypassing the user's own RLS policies for this specific query.
CREATE OR REPLACE FUNCTION get_customer_agreements(p_customer_phone TEXT)
RETURNS SETOF agreements AS $$
BEGIN
  -- This ensures that the function only returns agreements for the phone number passed as an argument.
  RETURN QUERY
  SELECT *
  FROM public.agreements
  WHERE agreements."customerPhone" = p_customer_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant the permission to execute this function to all authenticated users.
-- This is the missing piece that caused the error.
GRANT EXECUTE ON FUNCTION get_customer_agreements(TEXT) TO authenticated;
