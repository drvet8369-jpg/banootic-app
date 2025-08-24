-- ### SETUP FOR REAL-TIME CHAT ###
-- This script sets up the necessary database objects for the real-time chat feature.
-- Execute this script in your Supabase SQL editor.

-- 1. Create the 'messages' table to store all chat messages.
-- This table will hold the content of messages, link them to a chat, and track sender/receiver.
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    chat_id TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id),
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 2. Enable Row Level Security (RLS) on the 'messages' table.
-- This is a crucial security step to ensure users can't access messages from other chats.
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- 3. Create RLS policies for the 'messages' table.
-- These rules define who can do what with the data.

-- Policy for SELECT: Users can only read messages where they are the sender or receiver.
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" ON public.messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy for INSERT: A user can only insert a message if they are the sender.
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
CREATE POLICY "Users can insert their own messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);


-- 4. Enable real-time functionality for the 'messages' table.
-- This tells Supabase to broadcast changes on this table to subscribed clients.
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- 5. Create a database function to retrieve user conversations for the inbox.
-- This function gets all chats for a specific user, finds the last message, and details of the other participant.
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id uuid)
RETURNS TABLE (
    chat_id TEXT,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_phone TEXT,
    other_user_avatar TEXT,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
WITH last_messages AS (
    SELECT
        m.chat_id,
        (CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END) AS other_user_id,
        m.content,
        m.created_at,
        ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
    FROM messages m
    WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
)
SELECT
    lm.chat_id,
    lm.other_user_id,
    COALESCE(p.name, c.name, 'کاربر حذف شده') AS other_user_name,
    COALESCE(p.phone, c.phone) as other_user_phone,
    (p.profile_image ->> 'src')::text as other_user_avatar,
    lm.content AS last_message_content,
    lm.created_at AS last_message_at
FROM last_messages lm
LEFT JOIN providers p ON p.user_id = lm.other_user_id
LEFT JOIN customers c ON c.user_id = lm.other_user_id
WHERE lm.rn = 1
ORDER BY lm.created_at DESC;
$$;