
-- Create a custom type for agreement status for better data integrity
create type public.agreement_status as enum ('pending', 'accepted', 'rejected');

-- Add the 'status' column to the 'agreements' table using the new type
-- This will add the column if it does not exist, preventing errors on re-runs.
alter table public.agreements add column if not exists status public.agreement_status not null default 'pending';

-- Add 'agreements_count' to providers table
-- This will hold a cached count of accepted agreements for quick lookups.
alter table public.providers add column if not exists agreements_count integer not null default 0;

-- Create an RPC function to increment the agreements_count on the providers table.
-- This is a more efficient way to handle counters than read-modify-write from the client.
-- SECURITY DEFINER allows this function to be called by users but run with the permissions of the definer (postgres),
-- allowing it to update a table the user might not have direct write access to.
create or replace function public.increment_agreements (provider_profile_id_in uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.providers
  set agreements_count = agreements_count + 1
  where profile_id = provider_profile_id_in;
end;
$$;


-- Add 'is_read' column to messages table to track read status for inbox notifications.
alter table public.messages add column if not exists is_read boolean not null default false;

-- Add 'service_id' to profiles table. This was missing from the initial profile setup.
alter table public.profiles add column if not exists service_id integer null references public.services(id);


-- This function finds an existing conversation between two users or creates a new one if it doesn't exist.
-- It ensures there's only one conversation thread per pair of users.
create or replace function public.get_or_create_conversation(p_one uuid, p_two uuid)
returns table (
  id uuid,
  created_at timestamptz,
  participant_one_id uuid,
  participant_two_id uuid
)
language plpgsql
as $$
declare
    v_conversation_id uuid;
begin
    -- Sort UUIDs to ensure uniqueness regardless of who starts the conversation
    select c.id into v_conversation_id
    from public.conversations c
    where (c.participant_one_id = p_one and c.participant_two_id = p_two)
       or (c.participant_one_id = p_two and c.participant_two_id = p_one);

    if v_conversation_id is null then
        insert into public.conversations (participant_one_id, participant_two_id)
        values (
            case when p_one < p_two then p_one else p_two end,
            case when p_one < p_two then p_two else p_one end
        )
        returning conversations.id into v_conversation_id;
    end if;

    return query
    select *
    from public.conversations
    where conversations.id = v_conversation_id;
end;
$$;


-- This function fetches all conversations for a given user, joining the partner's profile information,
-- the last message details, and a count of unread messages for that conversation.
create or replace function public.get_user_conversations_with_unread(p_user_id uuid)
returns table (
    id uuid,
    created_at timestamptz,
    participant_one_id uuid,
    participant_two_id uuid,
    other_participant json,
    last_message_content text,
    last_message_at timestamptz,
    unread_count bigint
)
language plpgsql
as $$
begin
  return query
  with conversation_partners as (
    select
      c.id as conversation_id,
      case
        when c.participant_one_id = p_user_id then c.participant_two_id
        else c.participant_one_id
      end as partner_id
    from public.conversations c
    where c.participant_one_id = p_user_id or c.participant_two_id = p_user_id
  ),
  last_messages as (
    select
      conversation_id,
      first_value(content) over (partition by conversation_id order by created_at desc) as last_message_content,
      first_value(created_at) over (partition by conversation_id order by created_at desc) as last_message_at,
      row_number() over (partition by conversation_id order by created_at desc) as rn
    from public.messages
  ),
  unread_counts as (
    select
      m.conversation_id,
      count(*) as unread
    from public.messages m
    where m.receiver_id = p_user_id and m.is_read = false
    group by m.conversation_id
  )
  select
    c.id,
    c.created_at,
    c.participant_one_id,
    c.participant_two_id,
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'profile_image_url', p.profile_image_url
    ) as other_participant,
    lm.last_message_content,
    lm.last_message_at,
    coalesce(uc.unread, 0) as unread_count
  from public.conversations c
  join conversation_partners cp on c.id = cp.conversation_id
  join public.profiles p on p.id = cp.partner_id
  left join (select * from last_messages where rn = 1) lm on lm.conversation_id = c.id
  left join unread_counts uc on uc.conversation_id = c.id
  where c.id in (select conversation_id from conversation_partners)
  order by lm.last_message_at desc nulls last;
end;
$$;


-- A simple function to bulk-update messages to 'read' status for a given conversation and user.
create or replace function public.mark_messages_as_read(p_conversation_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.messages
  set is_read = true
  where conversation_id = p_conversation_id
    and receiver_id = p_user_id
    and is_read = false;
end;
$$;
