-- Create a table for public profiles
create table if not exists users (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  name text,
  phone text unique,
  email text unique,
  account_type text
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table users
  enable row level security;

create policy "Public profiles are viewable by everyone." on users
  for select using (true);

create policy "Users can insert their own profile." on users
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on users
  for update using (auth.uid() = id);

-- Create a table for providers, extending the users table
create table if not exists providers (
  id serial primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text,
  service text,
  location text,
  phone text unique,
  bio text,
  category_slug text,
  service_slug text,
  rating numeric(2,1) default 0.0,
  reviews_count integer default 0,
  profile_image jsonb,
  portfolio jsonb[]
);

alter table providers
  enable row level security;

create policy "Providers are viewable by everyone." on providers
  for select using (true);

create policy "Providers can insert their own profile." on providers
  for insert with check (auth.uid() = user_id);

create policy "Providers can update their own profile." on providers
  for update using (auth.uid() = user_id);


-- Create a table for customers, extending the users table
create table if not exists customers (
    id serial primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    name text,
    phone text
);

alter table customers
    enable row level security;

create policy "Customers are viewable by authenticated users." on customers
    for select using (auth.role() = 'authenticated');

create policy "Customers can insert their own profile." on customers
    for insert with check (auth.uid() = user_id);

create policy "Customers can update their own profile." on customers
    for update using (auth.uid() = user_id);


-- This trigger automatically creates a profile entry when a new user signs up.
-- and a customer entry by default.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create a public user profile
  insert into public.users (id, name, phone, email, account_type)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'email',
    new.raw_user_meta_data->>'account_type'
   );

  -- If the user is a customer, create a customer profile
  if new.raw_user_meta_data->>'account_type' = 'customer' then
    insert into public.customers (user_id, name, phone)
    values (
        new.id,
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'phone'
    );
  end if;

  return new;
end;
$$;

-- Drop existing trigger if it exists, to prevent errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

-- create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- This RPC function is for providers to create their specific profile after the user is created.
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
    values (
        p_user_id,
        p_name,
        p_service,
        p_location,
        p_phone,
        p_bio,
        p_category_slug,
        p_service_slug,
        '{"src": "", "ai_hint": "woman portrait"}',
        '{}'
    );
end;
$$;


-- Create conversations and messages tables for chat
create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    participant_one_id uuid references public.users(id) on delete cascade not null,
    participant_two_id uuid references public.users(id) on delete cascade not null,
    last_message_at timestamp with time zone,
    constraint unique_conversation unique (participant_one_id, participant_two_id)
);
alter table public.conversations enable row level security;
create policy "Users can view their own conversations" on public.conversations for select using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);


create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    sender_id uuid references public.users(id) on delete cascade not null,
    receiver_id uuid references public.users(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_read boolean default false
);
alter table public.messages enable row level security;
create policy "Users can view messages in their conversations" on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can insert messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can update their own messages (for read status)" on public.messages for update using (auth.uid() = receiver_id);


-- Create function to update last_message_at on new message
create or replace function public.update_conversation_timestamp()
returns trigger
language plpgsql
as $$
begin
    update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
    return new;
end;
$$;

-- Drop trigger if it exists to prevent errors on re-run
drop trigger if exists on_new_message on public.messages;

create trigger on_new_message
    after insert on public.messages
    for each row execute procedure public.update_conversation_timestamp();


-- RPC to get or create a conversation
create or replace function get_or_create_conversation(p_user_id_1 uuid, p_user_id_2 uuid)
returns public.conversations
language plpgsql
as $$
declare
    conversation_record public.conversations;
begin
    -- Sort IDs to ensure uniqueness regardless of order
    if p_user_id_1 > p_user_id_2 then
        -- swap ids
        declare temp_id uuid := p_user_id_1;
        begin
            p_user_id_1 := p_user_id_2;
            p_user_id_2 := temp_id;
        end;
    end if;

    select * into conversation_record
    from public.conversations
    where participant_one_id = p_user_id_1 and participant_two_id = p_user_id_2;

    if conversation_record is null then
        insert into public.conversations (participant_one_id, participant_two_id)
        values (p_user_id_1, p_user_id_2)
        returning * into conversation_record;
    end if;

    return conversation_record;
end;
$$;

-- RPC to get metadata for conversations list
create or replace function get_conversations_metadata(user_id uuid)
returns table (
    conversation_id uuid,
    last_message_content text,
    unread_count bigint
)
language sql
as $$
    select
        c.id as conversation_id,
        (select content from public.messages where conversation_id = c.id order by created_at desc limit 1) as last_message_content,
        (select count(*) from public.messages where conversation_id = c.id and receiver_id = user_id and is_read = false) as unread_count
    from
        public.conversations c
    where
        c.participant_one_id = user_id or c.participant_two_id = user_id;
$$;

-- Storage bucket for images
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "Public access for images"
on storage.objects for select
to public
using ( bucket_id = 'images' );

create policy "Users can upload images for their profile"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'images' and (storage.filename(name) like 'profile-pics/' || auth.uid() || '/%') or (storage.filename(name) like 'portfolio-items/' || auth.uid() || '/%'));

create policy "Users can update their own images"
on storage.objects for update
to authenticated
using ( bucket_id = 'images' and (storage.filename(name) like 'profile-pics/' || auth.uid() || '/%') or (storage.filename(name) like 'portfolio-items/' || auth.uid() || '/%'));

create policy "Users can delete their own images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'images' and (storage.filename(name) like 'profile-pics/' || auth.uid() || '/%') or (storage.filename(name) like 'portfolio-items/' || auth.uid() || '/%'));
