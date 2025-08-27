
create or replace function public.get_user_conversations (p_user_id uuid)
returns table (
  chat_id text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  other_user_phone text,
  last_message_content text,
  last_message_at timestamptz
)
language sql
as $$
  select
    c.chat_id,
    c.other_user_id,
    c.other_user_name,
    c.other_user_avatar,
    c.other_user_phone,
    (select content from public.messages where chat_id = c.chat_id order by created_at desc limit 1) as last_message_content,
    (select created_at from public.messages where chat_id = c.chat_id order by created_at desc limit 1) as last_message_at
  from
    (
      select
        m.chat_id,
        case
          when m.sender_id = p_user_id then m.receiver_id
          else m.sender_id
        end as other_user_id,
        row_number() over (
          partition by
            case
              when m.sender_id = p_user_id then m.receiver_id
              else m.sender_id
            end
          order by
            m.created_at desc
        ) as rn
      from
        public.messages as m
      where
        m.sender_id = p_user_id
        or m.receiver_id = p_user_id
    ) as m
    join lateral (
      select
        u.name as other_user_name,
        u.phone as other_user_phone,
        p.profile_image ->> 'src' as other_user_avatar
      from
        public.users as u
      left join public.providers as p on p.user_id = u.id
      where u.id = m.other_user_id
    ) as c on true
  where
    m.rn = 1
  order by last_message_at desc;
$$;
