-- Drop the old function if it exists to ensure a clean slate.
-- This is safe because we are immediately recreating it.
DROP FUNCTION IF EXISTS get_user_conversations(uuid);

-- Create the final, correct version of the function.
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE(
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_phone text,
    other_user_profile_image_src text,
    last_message_content text,
    last_message_at timestamptz,
    unread_count bigint
)
LANGUAGE sql
AS $$
WITH ranked_messages AS (
    SELECT
        m.*,
        ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
    FROM
        messages m
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
unread_counts AS (
    SELECT
        chat_id,
        count(*) as unread
    FROM
        messages
    WHERE
        receiver_id = p_user_id AND is_read = false
    GROUP BY
        chat_id
)
SELECT
    lm.chat_id,
    -- Determine the other user's ID
    CASE
        WHEN lm.sender_id = p_user_id THEN lm.receiver_id
        ELSE lm.sender_id
    END AS other_user_id,
    -- Get other user's name from the central users table
    u.name AS other_user_name,
    u.phone AS other_user_phone,
    -- Get other user's profile image ONLY if they are a provider
    (p.profile_image ->> 'src')::text AS other_user_profile_image_src,
    lm.content AS last_message_content,
    lm.created_at AS last_message_at,
    COALESCE(uc.unread, 0) AS unread_count
FROM
    latest_messages lm
-- Join with the users table to get the other user's details
JOIN public.users u ON u.id = (
    CASE
        WHEN lm.sender_id = p_user_id THEN lm.receiver_id
        ELSE lm.sender_id
    END
)
-- Left Join with providers table to get profile image, if it exists
LEFT JOIN public.providers p ON p.user_id = u.id
-- Left Join to get unread counts
LEFT JOIN unread_counts uc ON uc.chat_id = lm.chat_id
ORDER BY
    lm.created_at DESC;
$$;
