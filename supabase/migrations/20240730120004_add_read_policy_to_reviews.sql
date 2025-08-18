-- Create a policy to allow public read access to all reviews.
-- This is necessary so that anyone visiting a provider's profile page can see their reviews.
-- The data is non-sensitive and intended to be public.
CREATE POLICY "Public can read all reviews"
ON public.reviews
FOR SELECT
USING (true);