-- Create a table for public profiles
create table users (
  id uuid not null references auth.users on delete cascade,
  name text,
  account_type text,
  phone text,
  primary key (id)
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
-- This trigger automatically creates a profile for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, account_type, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'account_type',
    new.raw_user_meta_data->>'phone'
  );
  
  if new.raw_user_meta_data->>'account_type' = 'provider' then
    insert into public.providers (user_id, name, phone, service, location, bio, category_slug, service_slug, rating, reviews_count, profile_image, portfolio)
    values (
        new.id,
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'service',
        new.raw_user_meta_data->>'location',
        new.raw_user_meta_data->>'bio',
        new.raw_user_meta_data->>'category_slug',
        new.raw_user_meta_data->>'service_slug',
        0,
        0,
        '{"src": "", "ai_hint": "woman portrait"}',
        '[]'
    );
  elsif new.raw_user_meta_data->>'account_type' = 'customer' then
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
-- Drop existing trigger if it exists, to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a helper function to execute arbitrary SQL
-- This allows us to run this whole file using an RPC call
create or replace function execute_sql(sql text)
returns void
language plpgsql
as $$
begin
    execute sql;
end;
$$;