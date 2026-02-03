-- Migration Script: Clean up duplicate reviews, apply constraints, and fix stats.

-- Step 1: Clean up duplicate reviews.
-- This CTE identifies all reviews, numbering them within each user-provider pair.
-- The most recent review gets row number (rn) = 1.
WITH duplicates AS (
    SELECT
        id,
        ROW_NUMBER() OVER(
            PARTITION BY author_id, provider_id
            ORDER BY created_at DESC
        ) as rn
    FROM
        public.reviews
)
-- This deletes all but the most recent review for any user-provider pair.
DELETE FROM public.reviews
WHERE id IN (
    SELECT id
    FROM duplicates
    WHERE rn > 1
);

-- Step 2: Now that the data is clean, add the unique constraint.
-- This will now succeed because there are no more duplicates.
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_author_id_provider_id_key UNIQUE (author_id, provider_id);


-- Step 3: Drop the old, incomplete function to ensure a clean state.
DROP FUNCTION IF EXISTS public.update_provider_rating(provider_profile_id uuid);


-- Step 4: Create the new, correct RPC function to update all provider stats.
CREATE OR REPLACE FUNCTION public.update_provider_stats(p_provider_profile_id uuid)
RETURNS void AS $$
DECLARE
    new_avg_rating REAL;
    new_review_count INT;
BEGIN
    -- Calculate the new average rating and review count from the clean reviews table
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

    -- Update the providers table with the new, correct stats
    UPDATE
        public.providers
    SET
        rating = COALESCE(new_avg_rating, 0),
        reviews_count = COALESCE(new_review_count, 0)
    WHERE
        profile_id = p_provider_profile_id;
END;
$$ LANGUAGE plpgsql;


-- Step 5 (One-time Fix): Loop through all providers and update their stats.
-- This corrects the counters for everyone, including the provider you tested.
DO $$
DECLARE
    provider_rec RECORD;
BEGIN
    FOR provider_rec IN SELECT profile_id FROM public.providers
    LOOP
        PERFORM public.update_provider_stats(provider_rec.profile_id);
    END LOOP;
END $$;
