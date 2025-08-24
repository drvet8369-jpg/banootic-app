-- Drop existing policies if they exist, to prevent errors on re-run
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;

-- Drop existing functions if they exist, to prevent errors on re-run
DROP FUNCTION IF EXISTS public.get_user_conversations(text);


-- Enable Row Level Security for the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they have sent or received.
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.jwt()->>'phone' = sender_phone OR auth.jwt()->>'phone' = receiver_phone);

-- Policy: Users can only insert messages where they are the sender.
CREATE POLICY "Users can insert their own messages"
ON public.messages FOR INSERT
WITH CHECK (auth.jwt()->>'phone' = sender_phone);


-- Function to get all conversations for a user
create or replace function public.get_user_conversations(p_user_phone text)
returns table (
    chat_id text,
    other_user_phone text,
    other_user_name text,
    other_user_avatar text,
    last_message_content text,
    last_message_at timestamptz,
    unread_count bigint
)
as $$
begin
    return query
    with all_users as (
        select name, phone, profile_image->>'src' as avatar_url from public.providers
        union
        select name, phone, null as avatar_url from public.customers
    ),
    message_info as (
        select
            m.chat_id,
            m.content,
            m.created_at,
            m.sender_phone,
            m.receiver_phone,
            -- Determine the "other user" in the conversation
            case
                when m.sender_phone = p_user_phone then m.receiver_phone
                else m.sender_phone
            end as other_phone
        from public.messages m
        where m.sender_phone = p_user_phone or m.receiver_phone = p_user_phone
    ),
    latest_messages as (
        select
            chat_id,
            other_phone,
            max(created_at) as max_created_at
        from message_info
        group by chat_id, other_phone
    )
    select
        lm.chat_id,
        lm.other_phone as other_user_phone,
        u.name as other_user_name,
        u.avatar_url as other_user_avatar,
        mi.content as last_message_content,
        lm.max_created_at as last_message_at,
        0::bigint as unread_count -- Placeholder for unread count
    from latest_messages lm
    join message_info mi on lm.chat_id = mi.chat_id and lm.max_created_at = mi.created_at
    left join all_users u on lm.other_phone = u.phone
    order by last_message_at desc;
end;
$$ language plpgsql security definer;
