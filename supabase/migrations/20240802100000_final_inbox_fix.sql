-- =========== Final & Definitive Database Cleanup & Fix ===========
-- This script performs a "scorched earth" cleanup by dropping ALL possible
-- versions of the problematic functions before creating the single, correct version.

BEGIN;

-- Step 1: Drop ALL possible versions of the problematic functions.
-- This is the most critical step. We drop signatures both with and without parameters.
DROP FUNCTION IF EXISTS public.get_user_conversations_with_unread(uuid);
DROP FUNCTION IF EXISTS public.get_user_conversations_with_unread(); -- Drop parameter-less version if it exists

DROP FUNCTION IF EXISTS public.get_total_unread_message_count(uuid);
DROP FUNCTION IF EXISTS public.get_total_unread_message_count(); -- Drop parameter-less version if it exists

-- Step 2: Create the new, efficient function for counting total unread messages.
-- This is the only version that will exist going forward.
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

-- Step 3: Create the completely rewritten, correct, and final inbox function.
-- This uses the exact logic from our successful diagnostic test.
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
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'profile_image_url', p.profile_image_url
    ) AS other_participant,
    last_msg.content AS last_message_content,
    last_msg.created_at AS last_message_at,
    (SELECT count(*) FROM public.messages msg WHERE msg.conversation_id = c.id AND msg.receiver_id = p_user_id AND msg.is_read = FALSE) AS unread_count
  FROM
    public.conversations c
  JOIN public.profiles p ON p.id = (
    CASE
      WHEN c.participant_one_id = p_user_id THEN c.participant_two_id
      ELSE c.participant_one_id
    END
  )
  LEFT JOIN LATERAL (
    SELECT content, created_at
    FROM public.messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) last_msg ON true
  WHERE
    c.participant_one_id = p_user_id OR c.participant_two_id = p_user_id
  ORDER BY
    last_msg.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMIT;
