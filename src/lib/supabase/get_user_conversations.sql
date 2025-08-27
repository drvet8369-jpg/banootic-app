
-- This function is designed to be executed via Supabase RPC.
-- It fetches all conversation threads for a given user (p_user_id).

-- Drop the old function if it exists, to ensure a clean state.
DROP FUNCTION IF EXISTS public.get_user_conversations(p_user_id uuid);

-- Create the new, corrected function.
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE (
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_profile_image_src text,
    other_user_phone text,
    last_message_content text,
    last_message_at timestamptz,
    unread_count bigint
)
LANGUAGE sql
STABLE -- Indicates the function does not modify the database and is safe for read replicas.
AS $$
WITH last_message_details AS (
    -- Step 1: Find the latest message for each chat_id.
    -- We use ROW_NUMBER() to pick only the most recent message.
    SELECT
        m.chat_id,
        m.content,
        m.created_at,
        m.sender_id,
        m.receiver_id,
        -- Determine who the "other user" is in the conversation.
        CASE
            WHEN m.sender_id = p_user_id THEN m.receiver_id
            ELSE m.sender_id
        END AS other_user_id
    FROM
        public.messages m
    WHERE
        m.id IN (SELECT MAX(id) FROM public.messages GROUP BY chat_id)
        AND (m.sender_id = p_user_id OR m.receiver_id = p_user_id)
),
unread_counts AS (
    -- Step 2: Count unread messages for the current user in each chat.
    SELECT
        mu.chat_id,
        count(*) AS unread_count
    FROM
        public.messages mu
    WHERE
        mu.receiver_id = p_user_id AND mu.is_read = false
    GROUP BY
        mu.chat_id
)
-- Step 3: Join everything together to build the final output.
SELECT
    lmd.chat_id,
    lmd.other_user_id,
    -- Fetch the other user's details directly from the public.users table.
    other_user.name AS other_user_name,
    -- Check the providers table for a profile image, otherwise fallback to null.
    p.profile_image ->> 'src' as other_user_profile_image_src,
    other_user.phone AS other_user_phone,
    lmd.content AS last_message_content,
    lmd.created_at AS last_message_at,
    COALESCE(uc.unread_count, 0) AS unread_count
FROM
    last_message_details lmd
-- Join to get the other user's general information.
JOIN
    public.users other_user ON lmd.other_user_id = other_user.id
-- Left Join to get the provider-specific profile image (if they are a provider).
LEFT JOIN
    public.providers p ON lmd.other_user_id = p.user_id
-- Left Join to get the unread message count.
LEFT JOIN
    unread_counts uc ON lmd.chat_id = uc.chat_id
ORDER BY
    lmd.created_at DESC;
$$;
