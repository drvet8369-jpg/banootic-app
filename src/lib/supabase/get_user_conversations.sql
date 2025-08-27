-- This function retrieves all conversations for a given user,
-- showing the latest message for each conversation and details of the other participant.
create or replace function get_user_conversations(p_user_id uuid)
returns table (
    chat_id text,
    other_user_id uuid,
    other_user_name text,
    other_user_avatar text,
    other_user_phone text,
    last_message_content text,
    last_message_at timestamptz
)
language sql stable
as $$
with last_messages as (
    -- 1. Find the last message for each chat involving the user
    select distinct on (m.chat_id)
        m.chat_id,
        m.id,
        m.content,
        m.created_at,
        m.sender_id,
        m.receiver_id
    from messages m
    where m.sender_id = p_user_id or m.receiver_id = p_user_id
    order by m.chat_id, m.created_at desc
),
conversation_participants as (
    -- 2. Determine the "other" user in each conversation
    select
        lm.chat_id,
        lm.content as last_message_content,
        lm.created_at as last_message_at,
        case
            when lm.sender_id = p_user_id then lm.receiver_id
            else lm.sender_id
        end as other_user_id
    from last_messages lm
)
-- 3. Join with user and provider tables to get the final details
select
    cp.chat_id,
    cp.other_user_id,
    u.name as other_user_name,
    p.profile_image->>'src' as other_user_avatar,
    u.phone as other_user_phone,
    cp.last_message_content,
    cp.last_message_at
from conversation_participants cp
join users u on cp.other_user_id = u.id
left join providers p on cp.other_user_id = p.user_id
order by cp.last_message_at desc;
$$;
