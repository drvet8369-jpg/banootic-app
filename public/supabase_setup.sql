
-- ### SETUP FOR REALTIME CHAT ###

-- 1. Create the messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  chat_id text GENERATED ALWAYS AS (LEAST(sender_id::text, receiver_id::text) || '_' || GREATEST(sender_id::text, receiver_id::text)) STORED,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for the messages table
--    Users can see messages they sent or received.
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

--    Users can only insert messages where they are the sender.
CREATE POLICY "Users can insert their own messages"
ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- 3. Enable Realtime on the messages table
--    Go to Database -> Replication in your Supabase dashboard.
--    Click on "0 tables" under "Source" and toggle on the "messages" table.
--    Click "Save".

-- 4. Create a PostgreSQL Function to get conversations
--    Go to Database -> Functions in your Supabase dashboard and create a new function.
--    Paste the following SQL code.
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE(chat_id text, other_user_id uuid, other_user_phone text, last_message_content text, last_message_at timestamp with time zone)
LANGUAGE sql
AS $$
  WITH ranked_messages AS (
    SELECT
      m.chat_id,
      CASE
        WHEN m.sender_id = p_user_id THEN m.receiver_id
        ELSE m.sender_id
      END AS other_user_id,
      m.content,
      m.created_at,
      ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
    FROM
      messages m
    WHERE
      m.sender_id = p_user_id OR m.receiver_id = p_user_id
  )
  SELECT
    rm.chat_id,
    rm.other_user_id,
    u.phone as other_user_phone,
    rm.content as last_message_content,
    rm.created_at as last_message_at
  FROM
    ranked_messages rm
  JOIN
    users u ON rm.other_user_id = u.id
  WHERE
    rm.rn = 1
  ORDER BY
    rm.created_at DESC;
$$;
