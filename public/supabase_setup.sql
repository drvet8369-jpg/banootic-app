-- Drop the function if it exists to allow for re-creation
DROP FUNCTION IF EXISTS get_user_conversations(p_user_phone text);

-- Drop existing policies to allow re-creation
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;

-- Create the messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id text NOT NULL,
    sender_phone text NOT NULL,
    receiver_phone text NOT NULL,
    content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages table
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.jwt() ->> 'phone' = sender_phone OR auth.jwt() ->> 'phone' = receiver_phone);

CREATE POLICY "Users can insert their own messages"
ON public.messages FOR INSERT
WITH CHECK (auth.jwt() ->> 'phone' = sender_phone);


-- Function to get all conversations for a user based on their phone number
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_phone text)
RETURNS TABLE(
    chat_id text,
    other_user_phone text,
    other_user_name text,
    other_user_avatar text,
    last_message_content text,
    last_message_at timestamptz,
    unread_count bigint
)
AS $$
BEGIN
    RETURN QUERY
    WITH all_users AS (
        SELECT phone, name, NULL::jsonb as profile_image FROM public.customers
        UNION ALL
        SELECT phone, name, profile_image FROM public.providers
    ),
    ranked_messages AS (
        SELECT
            m.*,
            CASE
                WHEN m.sender_phone = p_user_phone THEN m.receiver_phone
                ELSE m.sender_phone
            END AS other_user_phone,
            ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
        FROM
            public.messages m
        WHERE
            m.sender_phone = p_user_phone OR m.receiver_phone = p_user_phone
    )
    SELECT
        rm.chat_id,
        rm.other_user_phone,
        au.name AS other_user_name,
        (au.profile_image ->> 'src')::text AS other_user_avatar,
        rm.content AS last_message_content,
        rm.created_at AS last_message_at,
        0::bigint AS unread_count -- Placeholder for unread count
    FROM
        ranked_messages rm
    JOIN
        all_users au ON rm.other_user_phone = au.phone
    WHERE
        rm.rn = 1
    ORDER BY
        rm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
