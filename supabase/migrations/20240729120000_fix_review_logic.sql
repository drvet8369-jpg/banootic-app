-- Migration file to fix review logic:
-- 1. Add a unique constraint to prevent duplicate reviews.
-- 2. Create a comprehensive function to update both rating and review count.

-- Step 1: Add a unique constraint to the reviews table.
-- This prevents a user (author_id) from reviewing a provider (provider_id) more than once.
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_author_id_provider_id_key UNIQUE (author_id, provider_id);


-- Step 2: Drop the old, incomplete function if it exists.
DROP FUNCTION IF EXISTS public.update_provider_rating(provider_profile_id uuid);


-- Step 3: Create a new, correct RPC function to update all provider stats.
-- This function will be called after a new review is inserted.
CREATE OR REPLACE FUNCTION public.update_provider_stats(p_provider_profile_id uuid)
RETURNS void AS $$
DECLARE
    new_avg_rating REAL;
    new_review_count INT;
BEGIN
    -- Calculate the new average rating and count from the reviews table
    SELECT
        AVG(rating),
        COUNT(*)
    INTO
        new_avg_rating,
        new_review_count
    FROM
        public.reviews
    WHERE
        provider_id = p_provider_profile_id;

    -- Update the providers table with the new stats
    UPDATE
        public.providers
    SET
        rating = COALESCE(new_avg_rating, 0),
        reviews_count = COALESCE(new_review_count, 0)
    WHERE
        profile_id = p_provider_profile_id;
END;
$$ LANGUAGE plpgsql;
