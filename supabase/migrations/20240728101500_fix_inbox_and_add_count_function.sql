-- =========== Final Inbox & Unread Count Fix ===========
-- This script fixes all known issues with the inbox and unread counts.
-- It is safe to run multiple times.

BEGIN;

-- Step 1: Drop the old, faulty functions to clear any caching issues.
DROP FUNCTION IF EXISTS public.get_user_conversations_with_unread(uuid);
DROP FUNCTION IF EXISTS public.get_total_unread_message_count(uuid);

-- Step 2: Create the corrected function for the main inbox page.
-- This version explicitly aliases the 'created_at' column to resolve ambiguity.
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
  WITH user_conversations AS (
    SELECT
      c.id,
      c.created_at AS conversation_created_at, -- ALIAS to resolve ambiguity
      c.participant_one_id,
      c.participant_two_id,
      CASE
        WHEN c.participant_one_id = p_user_id THEN c.participant_two_id
        ELSE c.participant_one_id
      END AS other_participant_id
    FROM public.conversations c
    WHERE c.participant_one_id = p_user_id OR c.participant_two_id = p_user_id
  ),
  latest_messages AS (
    SELECT
      conversation_id,
      MAX(created_at) AS last_message_at
    FROM public.messages
    GROUP BY conversation_id
  )
  SELECT
    uc.id,
    uc.conversation_created_at AS created_at, -- Use the aliased column
    uc.participant_one_id,
    uc.participant_two_id,
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'profile_image_url', p.profile_image_url
    ) AS other_participant,
    m.content AS last_message_content,
    lm.last_message_at,
    (SELECT count(*) FROM public.messages msg WHERE msg.conversation_id = uc.id AND msg.receiver_id = p_user_id AND msg.is_read = FALSE) AS unread_count
  FROM user_conversations uc
  JOIN public.profiles p ON p.id = uc.other_participant_id
  LEFT JOIN latest_messages lm ON lm.conversation_id = uc.id
  LEFT JOIN public.messages m ON m.conversation_id = lm.conversation_id AND m.created_at = lm.last_message_at
  ORDER BY lm.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a new, efficient function just for counting total unread messages.
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


COMMIT;
