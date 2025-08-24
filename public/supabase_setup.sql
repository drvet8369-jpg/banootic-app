-- Clear old structures first to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid);

-- Enable RLS for the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own messages (either as sender or receiver)
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create policy for users to insert messages where they are the sender
CREATE POLICY "Users can insert their own messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Function to get all conversation partners for a user
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE(
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_avatar text,
    last_message_content text,
    last_message_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
        SELECT 
            m.*,
            ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    ),
    all_users AS (
        SELECT id, name, null::jsonb as profile_image FROM customers
        UNION ALL
        SELECT user_id as id, name, profile_image FROM providers
    )
    SELECT
        rm.chat_id,
        (CASE WHEN rm.sender_id = p_user_id THEN rm.receiver_id ELSE rm.sender_id END) as other_user_id,
        u.name as other_user_name,
        (u.profile_image->>'src')::text as other_user_avatar,
        rm.content as last_message_content,
        rm.created_at as last_message_at
    FROM ranked_messages rm
    JOIN all_users u ON u.id = (CASE WHEN rm.sender_id = p_user_id THEN rm.receiver_id ELSE rm.sender_id END)
    WHERE rm.rn = 1
    ORDER BY rm.created_at DESC;
END;
$$;
