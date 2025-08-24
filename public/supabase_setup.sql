-- Enable Realtime for the messages table
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table messages;

-- Function to get all conversations for a user
create or replace function get_user_conversations(p_user_id uuid)
returns table (
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_phone text,
    last_message_content text,
    last_message_at timestamptz,
    unread_count bigint
) as $$
begin
    return query
    with conversation_participants as (
        select
            m.chat_id,
            case
                when m.sender_id = p_user_id then m.receiver_id
                else m.sender_id
            end as other_user_id
        from messages m
        where m.sender_id = p_user_id or m.receiver_id = p_user_id
    ),
    latest_messages as (
        select
            chat_id,
            max(created_at) as max_created_at
        from messages
        group by chat_id
    )
    select
        cp.chat_id,
        cp.other_user_id,
        coalesce(prov.name, cust.name, 'کاربر حذف شده') as other_user_name,
        coalesce(prov.phone, cust.phone) as other_user_phone,
        m.content as last_message_content,
        m.created_at as last_message_at,
        0::bigint as unread_count -- Placeholder for unread count
    from conversation_participants cp
    join latest_messages lm on cp.chat_id = lm.chat_id
    join messages m on m.chat_id = lm.chat_id and m.created_at = lm.max_created_at
    left join providers prov on prov.user_id = cp.other_user_id
    left join customers cust on cust.user_id = cp.other_user_id
    group by cp.chat_id, cp.other_user_id, other_user_name, other_user_phone, last_message_content, last_message_at
    order by last_message_at desc;
end;
$$ language plpgsql security definer;

-- RLS Policies for messages table
-- Make sure RLS is enabled for the messages table in your Supabase dashboard.

-- Allow users to see only their own messages
create policy "Allow individual read access"
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Allow users to insert messages where they are the sender
create policy "Allow individual insert access"
on public.messages for insert
with check (auth.uid() = sender_id);
