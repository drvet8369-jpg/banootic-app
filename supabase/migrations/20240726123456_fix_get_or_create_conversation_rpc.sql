-- supabase/migrations/20240726123456_fix_get_or_create_conversation_rpc.sql

-- This script fixes the "ambiguous column" error in the chat creation function
-- by using clear, unambiguous parameter names, following our previous successful experience.

BEGIN;

-- Step 1: Drop the old, ambiguous function to ensure a clean state.
DROP FUNCTION IF EXISTS public.get_or_create_conversation(uuid, uuid);

-- Step 2: Create the new, corrected function with unambiguous parameter names.
-- 'p_one' is renamed to 'p_user_one_id'
-- 'p_two' is renamed to 'p_user_two_id'
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    p_user_one_id UUID,
    p_user_two_id UUID
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    participant_one_id UUID,
    participant_two_id UUID
)
AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Atomically find or create the conversation to prevent race conditions
    WITH conv AS (
        SELECT c.id
        FROM public.conversations c
        WHERE
            (c.participant_one_id = p_user_one_id AND c.participant_two_id = p_user_two_id)
            OR
            (c.participant_one_id = p_user_two_id AND c.participant_two_id = p_user_one_id)
        LIMIT 1
    ),
    -- If no conversation is found, insert one
    new_conv AS (
        INSERT INTO public.conversations (participant_one_id, participant_two_id)
        SELECT p_user_one_id, p_user_two_id
        WHERE NOT EXISTS (SELECT 1 FROM conv)
        RETURNING conversations.id
    )
    SELECT COALESCE(conv.id, new_conv.id)
    INTO v_conversation_id
    FROM (SELECT 1) AS dummy
    LEFT JOIN conv ON true
    LEFT JOIN new_conv ON true;

    -- Return the full conversation record using its ID
    RETURN QUERY
    SELECT c.id, c.created_at, c.participant_one_id, c.participant_two_id
    FROM public.conversations c
    WHERE c.id = v_conversation_id;

END;
$$ LANGUAGE plpgsql;

COMMIT;
