-- Enable the pgcrypto extension for gen_random_uuid()
create extension if not exists "pgcrypto" with schema "extensions";

-- Create a custom type for user account roles
create type public.user_account_type as enum ('provider', 'customer');

-- Create the users table
create table public.users (
    id uuid primary key not null default extensions.gen_random_uuid(),
    name text not null,
    phone text not null unique,
    account_type public.user_account_type not null,
    created_at timestamp with time zone not null default now()
);
comment on table public.users is 'Stores public user profile information.';

-- Create the providers table
create table public.providers (
    id bigint primary key generated always as identity,
    user_id uuid not null references public.users(id) on delete cascade,
    name text not null,
    phone text not null unique,
    service text not null,
    location text not null default 'ارومیه',
    bio text not null,
    category_slug text not null,
    service_slug text not null,
    rating numeric(2, 1) not null default 0.0,
    reviews_count integer not null default 0,
    profile_image jsonb,
    portfolio jsonb,
    created_at timestamp with time zone not null default now()
);
comment on table public.providers is 'Stores detailed information for service providers.';

-- Create the customers table
create table public.customers (
    id bigint primary key generated always as identity,
    user_id uuid not null references public.users(id) on delete cascade,
    created_at timestamp with time zone not null default now()
);
comment on table public.customers is 'Stores information specific to customers.';

-- Create the reviews table
create table public.reviews (
    id bigint primary key generated always as identity,
    provider_id bigint not null references public.providers(id) on delete cascade,
    customer_id uuid not null references public.users(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone not null default now()
);
comment on table public.reviews is 'Stores reviews and ratings from customers for providers.';

-- Create the agreements table
create table public.agreements (
    id bigint primary key generated always as identity,
    customer_phone text not null,
    provider_phone text not null,
    status text not null default 'pending',
    requested_at timestamp with time zone not null default now(),
    confirmed_at timestamp with time zone
);
comment on table public.agreements is 'Tracks service agreements between customers and providers.';

-- Create conversations table
create table public.conversations (
    id uuid primary key not null default extensions.gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    participant_one_id uuid not null references public.users(id) on delete cascade,
    participant_two_id uuid not null references public.users(id) on delete cascade,
    last_message_at timestamp with time zone,
    constraint participants_unique unique (participant_one_id, participant_two_id)
);
comment on table public.conversations is 'Represents a chat conversation between two users.';

-- Create messages table
create table public.messages (
    id uuid primary key not null default extensions.gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_id uuid not null references public.users(id) on delete cascade,
    receiver_id uuid not null references public.users(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone not null default now(),
    is_read boolean not null default false
);
comment on table public.messages is 'Stores individual chat messages within a conversation.';

-- Add indexes for performance
create index on public.providers (user_id);
create index on public.customers (user_id);
create index on public.reviews (provider_id);
create index on public.reviews (customer_id);
create index on public.conversations (participant_one_id);
create index on public.conversations (participant_two_id);
create index on public.messages (conversation_id);
create index on public.messages (sender_id);
create index on public.messages (receiver_id);
