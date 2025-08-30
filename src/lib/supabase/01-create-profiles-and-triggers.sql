
-- Drop existing objects to ensure a clean slate, ignoring errors if they don't exist.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.create_public_profile_for_user;
drop function if exists public.get_or_create_conversation;

-- 1. Create the function to insert a new user profile
-- This function runs when a new user signs up in Supabase Auth.
create or replace function public.create_public_profile_for_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Insert a new row into the public.users table
  insert into public.users (id, name, account_type, phone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    (new.raw_user_meta_data ->> 'account_type')::public.account_type,
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  return new;
end;
$$;

-- 2. Create the trigger to call the function
-- This trigger fires after a new user is created in the auth.users table.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_public_profile_for_user();


-- 3. Create the function for provider profile creation
-- This is called from the registration form in the app.
create or replace function public.create_provider_profile(
    p_user_id uuid,
    p_name text,
    p_service text,
    p_location text,
    p_phone text,
    p_bio text,
    p_category_slug text,
    p_service_slug text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.providers (user_id, name, service, location, phone, bio, category_slug, service_slug, profile_image, portfolio)
    values (p_user_id, p_name, p_service, p_location, p_phone, p_bio, p_category_slug, p_service_slug, '{"src": "", "ai_hint": "woman portrait"}', '{}');
end;
$$;

-- 4. Create the function to handle customer profile creation
create or replace function public.create_customer_profile(
    p_user_id uuid,
    p_name text,
    p_phone text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.customers (user_id, name, phone)
    values (p_user_id, p_name, p_phone);
end;
$$;

-- 5. Function to get or create a conversation between two users
create or replace function public.get_or_create_conversation(p_user_id_1 uuid, p_user_id_2 uuid)
returns setof public.conversations
language plpgsql
as $$
declare
    v_conversation_id uuid;
begin
    -- Try to find an existing conversation
    select id into v_conversation_id
    from public.conversations
    where (participant_one_id = p_user_id_1 and participant_two_id = p_user_id_2)
       or (participant_one_id = p_user_id_2 and participant_two_id = p_user_id_1);

    -- If no conversation is found, create a new one
    if v_conversation_id is null then
        insert into public.conversations (participant_one_id, participant_two_id)
        values (p_user_id_1, p_user_id_2)
        returning id into v_conversation_id;
    end if;

    -- Return the found or newly created conversation
    return query select * from public.conversations where id = v_conversation_id;
end;
$$;


-- 6. Function to get metadata for conversations list
create or replace function public.get_conversations_metadata(user_id uuid)
returns table (
    conversation_id uuid,
    last_message_content text,
    unread_count bigint
)
language sql
as $$
    select
        c.id as conversation_id,
        (
            select content from public.messages
            where conversation_id = c.id
            order by created_at desc
            limit 1
        ) as last_message_content,
        (
            select count(*) from public.messages
            where conversation_id = c.id and receiver_id = user_id and is_read = false
        ) as unread_count
    from public.conversations c
    where c.participant_one_id = user_id or c.participant_two_id = user_id;
$$;
