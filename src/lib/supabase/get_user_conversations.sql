-- Drop the old, problematic function if it exists.
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid);

-- Create the new, correct, and final version of the function.
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
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
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
        SELECT *
        FROM ranked_messages
        WHERE rn = 1
    )
    SELECT
        lm.chat_id,
        -- Correctly identify the other user's ID
        CASE
            WHEN lm.sender_id = p_user_id THEN lm.receiver_id
            ELSE lm.sender_id
        END AS other_user_id,
        -- Get the other user's name directly from the users table
        ou.name AS other_user_name,
        -- Get the other user's phone directly from the users table
        ou.phone AS other_user_phone,
        -- Safely get the profile image ONLY if the other user is a provider
        (p.profile_image ->> 'src')::text AS other_user_profile_image_src,
        lm.content AS last_message_content,
        lm.created_at AS last_message_at,
        -- Count unread messages for the current user (p_user_id) in this chat
        (SELECT COUNT(*)
         FROM public.messages mu
         WHERE mu.chat_id = lm.chat_id
           AND mu.receiver_id = p_user_id
           AND mu.is_read = false
        ) AS unread_count
    FROM
        latest_messages lm
    -- Join with the users table to get the other user's details
    JOIN public.users ou ON ou.id = (
        CASE
            WHEN lm.sender_id = p_user_id THEN lm.receiver_id
            ELSE lm.sender_id
        END
    )
    -- LEFT JOIN with providers to safely get the profile image
    LEFT JOIN public.providers p ON p.user_id = ou.id
    ORDER BY
        lm.created_at DESC;
END;
$$;
