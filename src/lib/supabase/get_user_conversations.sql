-- Drop the old function if it exists, to be replaced by the new version.
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid);

-- Re-create the function with corrected logic to fetch all conversations for a user.
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE(
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_profile_image_src text,
    other_user_phone text,
    last_message_content text,
    last_message_at timestamptz,
    unread_count bigint
)
LANGUAGE sql STABLE
AS $$
WITH ranked_messages AS (
  SELECT
    m.chat_id,
    m.content,
    m.created_at,
    m.sender_id,
    m.receiver_id,
    m.is_read,
    -- Assign a rank to each message within its chat, latest first
    ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
  FROM
    public.messages m
  WHERE
    m.sender_id = p_user_id OR m.receiver_id = p_user_id
),
last_messages AS (
    -- Select only the latest message for each chat
    SELECT * FROM ranked_messages WHERE rn = 1
)
SELECT
    lm.chat_id,
    -- Determine the other user's ID
    CASE
      WHEN lm.sender_id = p_user_id THEN lm.receiver_id
      ELSE lm.sender_id
    END AS other_user_id,
    -- Get the other user's details from the 'users' table
    u.name AS other_user_name,
    (u.profile_image ->> 'src')::text AS other_user_profile_image_src,
    u.phone AS other_user_phone,
    lm.content AS last_message_content,
    lm.created_at AS last_message_at,
    -- Count unread messages for the current user in each chat
    (SELECT COUNT(*) FROM public.messages mu WHERE mu.chat_id = lm.chat_id AND mu.receiver_id = p_user_id AND mu.is_read = false) AS unread_count
FROM
    last_messages lm
JOIN 
    public.users u ON u.id = (
        CASE
            WHEN lm.sender_id = p_user_id THEN lm.receiver_id
            ELSE lm.sender_id
        END
    )
ORDER BY 
    lm.created_at DESC;
$$;
