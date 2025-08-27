
CREATE OR REPLACE FUNCTION public.get_conversations_metadata(user_id uuid)
RETURNS TABLE(conversation_id uuid, last_message_content text, unread_count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH last_messages AS (
    SELECT
      m.conversation_id,
      m.content,
      ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
    FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id
  ),
  unread_counts AS (
    SELECT
      m.conversation_id,
      COUNT(*) as unread
    FROM public.messages m
    WHERE m.receiver_id = user_id AND m.is_read = false
    GROUP BY m.conversation_id
  )
  SELECT
    c.id as conversation_id,
    lm.content as last_message_content,
    COALESCE(uc.unread, 0) as unread_count
  FROM public.conversations c
  LEFT JOIN last_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
  LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
  WHERE c.participant_one_id = user_id OR c.participant_two_id = user_id;
$$;
