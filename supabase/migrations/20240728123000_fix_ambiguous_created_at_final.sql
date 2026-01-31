-- =========== Ultimate Inbox Function Rewrite (Final Attempt) ===========
-- This script completely replaces the inbox function with a simpler, more robust,
-- and more efficient version using a LATERAL join to eliminate all ambiguity.

BEGIN;

-- Step 1: Drop the old, problematic functions to ensure a clean state.
DROP FUNCTION IF EXISTS public.get_user_conversations_with_unread(uuid);
DROP FUNCTION IF EXISTS public.get_total_unread_message_count(uuid);

-- Step 2: Re-create the new, efficient function for counting total unread messages.
CREATE OR REPLACE FUNCTION public.get_total_unread_message_count(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
    total_unread BIGINT;
BEGIN
    SELECT count(*)
    INTO total_unread
    FROM public.messages msg
    WHERE msg.receiver_id = p_user_id AND msg.is_read = FALSE;

    RETURN total_unread;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the completely rewritten inbox function using a LATERAL JOIN.
-- This approach is standard, highly efficient, and removes all ambiguity.
CREATE OR REPLACE FUNCTION public.get_user_conversations_with_unread(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    participant_one_id UUID,
    participant_two_id UUID,
    other_participant JSON,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.created_at,
    c.participant_one_id,
    c.participant_two_id,
    -- Build the JSON object for the other participant
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'profile_image_url', p.profile_image_url
    ) AS other_participant,
    -- Get content and timestamp from the latest message found by the LATERAL join
    last_msg.content,
    last_msg.created_at AS last_message_at,
    -- Subquery to count unread messages for the current user in this conversation
    (SELECT count(*) FROM public.messages msg WHERE msg.conversation_id = c.id AND msg.receiver_id = p_user_id AND msg.is_read = FALSE) AS unread_count
  FROM
    public.conversations c
  -- Join to get the other participant's profile
  JOIN public.profiles p ON p.id = (
    CASE
      WHEN c.participant_one_id = p_user_id THEN c.participant_two_id
      ELSE c.participant_one_id
    END
  )
  -- Use a LATERAL join to efficiently find the single latest message for EACH conversation
  LEFT JOIN LATERAL (
    SELECT content, created_at
    FROM public.messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) last_msg ON true
  -- Filter to get only conversations involving the current user
  WHERE
    c.participant_one_id = p_user_id OR c.participant_two_id = p_user_id
  -- Order the final results by the timestamp of the last message
  ORDER BY
    last_msg.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;


COMMIT;
