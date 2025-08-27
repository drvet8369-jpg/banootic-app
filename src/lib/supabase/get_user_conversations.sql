-- This function retrieves all conversations for a given user,
-- including the other participant's details, the last message, and the unread count.
-- DROP FUNCTION IF EXISTS public.get_user_conversations(uuid); -- Optional: remove if exists

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
SECURITY DEFINER
AS $$
WITH last_messages AS (
    -- Find the last message for each chat the user is part of
    SELECT
        m.chat_id,
        m.id AS message_id,
        -- Use a window function to get the latest message in each chat_id partition
        ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
    FROM
        public.messages m
    WHERE
        m.sender_id = p_user_id OR m.receiver_id = p_user_id
)
-- Main query to construct the conversation list
SELECT
    lm.chat_id,
    -- Determine the other user's ID
    CASE
        WHEN m.sender_id = p_user_id THEN m.receiver_id
        ELSE m.sender_id
    END AS other_user_id,
    -- Get the other user's details from the public.users table
    u.name AS other_user_name,
    u.phone AS other_user_phone,
    -- Check if the other user is a provider to get their profile image
    (SELECT p.profile_image->>'src' FROM public.providers p WHERE p.user_id = u.id) AS other_user_profile_image_src,
    m.content AS last_message_content,
    m.created_at AS last_message_at,
    -- Count unread messages where the current user is the receiver
    (
        SELECT COUNT(*)
        FROM public.messages mu
        WHERE mu.chat_id = lm.chat_id
        AND mu.receiver_id = p_user_id
        AND mu.is_read = false
    ) AS unread_count
FROM
    last_messages lm
JOIN
    public.messages m ON lm.message_id = m.id
JOIN
    -- Join with users table to get the other participant's info
    public.users u ON u.id = (
        CASE
            WHEN m.sender_id = p_user_id THEN m.receiver_id
            ELSE m.sender_id
        END
    )
WHERE
    lm.rn = 1 -- Only select the very last message for each conversation
ORDER BY
    m.created_at DESC; -- Order conversations by the most recent message
$$;
