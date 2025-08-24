-- Drop existing objects to ensure a clean slate
DROP FUNCTION IF EXISTS public.get_user_conversations(p_user_id uuid);
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

-- Create the messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id text NOT NULL,
    sender_id uuid NOT NULL REFERENCES auth.users(id),
    receiver_id uuid NOT NULL REFERENCES auth.users(id),
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON public.messages (chat_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages (receiver_id);

-- Enable RLS on the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert their own messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can view their own messages
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- Function to get all conversations for a user
create or replace function public.get_user_conversations(p_user_id uuid)
returns table(
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_phone text,
    last_message_content text,
    last_message_at timestamptz
)
language plpgsql
security definer
as $$
begin
    return query
    with all_users as (
        -- Combine providers and customers into a single view
        select id, name, phone from public.providers
        union
        select id, name, phone from public.customers
    ),
    last_messages as (
        -- Get the last message for each conversation involving the current user
        select
            m.chat_id,
            m.content,
            m.created_at,
            m.sender_id,
            m.receiver_id,
            row_number() over (partition by m.chat_id order by m.created_at desc) as rn
        from
            public.messages m
        where
            m.sender_id = p_user_id or m.receiver_id = p_user_id
    )
    select
        lm.chat_id,
        -- Determine the other user's ID
        case
            when lm.sender_id = p_user_id then lm.receiver_id
            else lm.sender_id
        end as other_user_id,
        -- Get other user's name
        u.name as other_user_name,
        -- Get other user's phone
        u.phone as other_user_phone,
        lm.content as last_message_content,
        lm.created_at as last_message_at
    from
        last_messages lm
    -- Join with our combined user view to get the other user's details
    join all_users u on u.id = (
        case
            when lm.sender_id = p_user_id then lm.receiver_id
            else lm.sender_id
        end
    )
    where
        lm.rn = 1
    order by
        lm.created_at desc;
end;
$$;
