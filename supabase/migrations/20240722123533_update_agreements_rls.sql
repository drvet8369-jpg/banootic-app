-- Drop the existing policy to recreate it
DROP POLICY IF EXISTS "select_policy" ON "public"."agreements";

-- Create a new, corrected policy for selecting agreements
CREATE POLICY "select_policy" ON "public"."agreements"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  (get_user_account_type() = 'provider' AND "providerPhone" = current_setting('request.jwt.claims', true)::jsonb ->> 'phone') OR
  (get_user_account_type() = 'customer' AND "customer_phone" = current_setting('request.jwt.claims', true)::jsonb ->> 'phone')
);

-- Note: The previous logic checking for status ('pending', 'confirmed') was removed.
-- The new policy correctly allows users to see all their agreements regardless of status,
-- which was the source of the error. The filtering is now correctly handled by the application logic.
