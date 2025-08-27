-- Drop the old, incorrect function if it exists
DROP FUNCTION IF EXISTS public.get_user_conversations(p_user_id uuid);

-- Create a new, simpler, and more robust function
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE(
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_phone text,
    other_user_avatar text,
    last_message_content text,
    last_message_at timestamptz,
    last_message_sender uuid
)
LANGUAGE sql
STABLE
AS $$
WITH ranked_messages AS (
  SELECT
    m.*,
    ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
  FROM
    public.messages m
  WHERE
    m.sender_id = p_user_id OR m.receiver_id = p_user_id
),
latest_messages AS (
  SELECT
    *
  FROM
    ranked_messages
  WHERE
    rn = 1
),
other_users AS (
  SELECT
    lm.chat_id,
    CASE
      WHEN lm.sender_id = p_user_id THEN lm.receiver_id
      ELSE lm.sender_id
    END as other_id
  FROM
    latest_messages lm
)
SELECT
    lm.chat_id,
    ou.other_id as other_user_id,
    u.name as other_user_name,
    u.phone as other_user_phone,
    -- Get the avatar from the provider table if it exists, otherwise it's null
    (SELECT p.profile_image ->> 'src' FROM public.providers p WHERE p.user_id = u.id) as other_user_avatar,
    lm.content as last_message_content,
    lm.created_at as last_message_at,
    lm.sender_id as last_message_sender
FROM
    latest_messages lm
JOIN
    other_users ou ON lm.chat_id = ou.chat_id
JOIN
    public.users u ON u.id = ou.other_id
ORDER BY
    lm.created_at DESC;
$$;
