-- Drop the old function definition first to avoid signature conflicts.
DROP FUNCTION IF EXISTS get_user_conversations(uuid);

-- Create the table for messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own messages
-- Users can see messages where they are either the sender or the receiver.
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create policy for users to insert their own messages
-- A user can only insert a message if they are the sender.
CREATE POLICY "Users can insert their own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Set up real-time on the messages table
-- This block ensures that we don't try to re-create the publication,
-- which would cause an error.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
END $$;


-- Function to get all conversation partners for a user
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    chat_id TEXT,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_phone TEXT,
    last_message_content TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
        SELECT
            m.chat_id,
            m.content,
            m.created_at,
            m.sender_id,
            m.receiver_id,
            ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
        FROM messages m
        WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    )
    SELECT
        rm.chat_id,
        CASE
            WHEN rm.sender_id = p_user_id THEN rm.receiver_id
            ELSE rm.sender_id
        END AS other_user_id,
        COALESCE(p.name, c.name, 'کاربر حذف شده') AS other_user_name,
        COALESCE(p.phone, c.phone, '00000000000') AS other_user_phone,
        rm.content AS last_message_content,
        rm.created_at AS last_message_at,
        0::bigint AS unread_count -- Placeholder for unread count logic
    FROM ranked_messages rm
    LEFT JOIN providers p ON p.user_id = CASE WHEN rm.sender_id = p_user_id THEN rm.receiver_id ELSE rm.sender_id END
    LEFT JOIN customers c ON c.user_id = CASE WHEN rm.sender_id = p_user_id THEN rm.receiver_id ELSE rm.sender_id END
    WHERE rm.rn = 1
    ORDER BY rm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
