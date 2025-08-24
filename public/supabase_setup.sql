-- First, drop the existing function and its dependencies if it exists, to avoid errors on re-run.
DROP FUNCTION IF EXISTS get_user_conversations(p_user_id uuid);

-- Then, drop the policies if they exist.
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;

-- Drop the table if it exists
DROP TABLE IF EXISTS public.messages;

-- Create the messages table
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    content text,
    sender_id uuid,
    receiver_id uuid, -- Corrected typo from reciever_id to receiver_id
    chat_id text NOT NULL
);

-- Set up Primary Key
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

-- Set up Foreign Keys to the users table
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create Policies for RLS
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages" ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Create a function to get all conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id uuid)
RETURNS TABLE(
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_phone text,
    last_message_content text,
    last_message_at timestamp with time zone,
    unread_count bigint
)
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
    last_messages AS (
        SELECT *
        FROM ranked_messages
        WHERE rn = 1
    )
    SELECT 
        lm.chat_id,
        CASE
            WHEN lm.sender_id = p_user_id THEN lm.receiver_id
            ELSE lm.sender_id
        END AS other_user_id,
        COALESCE(p.name, c.name, 'کاربر حذف شده') AS other_user_name,
        COALESCE(p.phone, c.phone) AS other_user_phone,
        lm.content AS last_message_content,
        lm.created_at AS last_message_at,
        (SELECT COUNT(*) FROM messages m2 WHERE m2.chat_id = lm.chat_id AND m2.receiver_id = p_user_id AND m2.is_read = false) AS unread_count
    FROM last_messages lm
    LEFT JOIN providers p ON p.user_id = (CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END)
    LEFT JOIN customers c ON c.user_id = (CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END)
    ORDER BY lm.created_at DESC;
END;
$$ language plpgsql security definer;

-- Additionally, add the is_read column to the messages table
ALTER TABLE public.messages ADD COLUMN is_read boolean DEFAULT false;

-- Create an index on chat_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
