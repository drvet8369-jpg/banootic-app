-- Enable the pg_trgm extension for fuzzy string matching
create extension if not exists pg_trgm;

-- Define an enum for account types
create type public.account_type as enum ('customer', 'provider');

-- USERS & PROFILES
-- Stores public profile data for users.
-- Linked to auth.users via a trigger.
create table public.profiles (
  id uuid not null primary key, -- references auth.users(id) on delete cascade,
  updated_at timestamp with time zone,
  full_name text,
  account_type public.account_type not null default 'customer',
  -- Provider specific fields
  service_description text,
  bio text,
  location text,
  phone text,
  category_id integer, -- references public.categories(id),
  service_id integer, -- references public.services(id),
  rating numeric(2, 1) default 0.0,
  reviews_count integer default 0,
  profile_image_url text,
  portfolio_urls text[],
  -- Full-text search vector
  fts tsvector generated always as (
    to_tsvector('simple', coalesce(full_name, '') || ' ' || coalesce(service_description, '') || ' ' || coalesce(bio, ''))
  ) stored
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);
create policy "Admins can do anything." on public.profiles for all using (true) with check (true);

-- Create a GIN index for full-text search
create index profiles_fts_idx on public.profiles using gin (fts);


-- This trigger automatically creates a profile entry when a new user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, account_type)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.phone,
    (new.raw_user_meta_data->>'account_type')::public.account_type
  );
  return new;
end;
$$;

-- Attach the trigger to the auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- CATEGORIES
-- Stores the main service categories.
create table public.categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text
);
alter table public.categories enable row level security;
create policy "Categories are public." on public.categories for select using (true);
-- Populate with initial data
insert into public.categories (name, slug, description) values
  ('خدمات زیبایی بانوان', 'beauty', 'خدمات مو، ناخن، آرایش و مراقبت از پوست توسط متخصصان محلی با استعداد.'),
  ('آشپزی و غذای خانگی', 'cooking', 'غذاهای خانگی خوشمزه و اصیل، شیرینی‌جات و غذاهای سنتی.'),
  ('خیاطی و طراحی مد', 'tailoring', 'لباس‌های سفارشی، تعمیرات و طراحی‌های مد منحصر به فرد از بوتیک‌های محلی.'),
  ('صنایع دستی و تزئینی', 'handicrafts', 'کاردستی‌های دکوری، هنرهای تزئینی و محصولات دست‌ساز منحصر به فرد.');


-- SERVICES
-- Stores the specific services within each category.
create table public.services (
  id serial primary key,
  name text not null,
  slug text not null,
  category_id integer not null references public.categories(id),
  unique (slug, category_id)
);
alter table public.services enable row level security;
create policy "Services are public." on public.services for select using (true);
-- Populate with initial data
insert into public.services (name, slug, category_id) values
  ('خدمات ناخن', 'manicure-pedicure', 1),
  ('خدمات مو', 'haircut-coloring', 1),
  ('پاکسازی پوست', 'facial-treatment', 1),
  ('آرایش صورت', 'makeup', 1),
  ('اپیلاسیون', 'waxing', 1),
  ('غذای سنتی', 'traditional-food', 2),
  ('کیک و شیرینی', 'cakes-sweets', 2),
  ('غذای گیاهی', 'vegetarian-vegan', 2),
  ('فینگرفود', 'finger-food', 2),
  ('نان خانگی', 'homemade-bread', 2),
  ('دوخت سفارشی لباس', 'custom-clothing', 3),
  ('مزون، لباس عروس و مجلسی', 'fashion-design-mezon', 3),
  ('تعمیرات تخصصی لباس', 'clothing-repair', 3),
  ('زیورآلات دست‌ساز', 'handmade-jewelry', 4),
  ('سفال تزئینی', 'decorative-pottery', 4),
  ('بافتنی‌ها', 'termeh-kilim', 4),
  ('چرم‌دوزی', 'leather-crafts', 4),
  ('شمع‌سازی', 'candles-soaps', 4);

-- Add foreign key constraints to profiles now that other tables exist
alter table public.profiles add constraint fk_category foreign key (category_id) references public.categories(id);
alter table public.profiles add constraint fk_service foreign key (service_id) references public.services(id);


-- REVIEWS
-- Stores reviews submitted by customers for providers.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id),
  author_id uuid not null references public.profiles(id),
  author_name text not null, -- Denormalized for convenience
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);
alter table public.reviews enable row level security;
create policy "Reviews are public." on public.reviews for select using (true);
create policy "Authenticated users can post reviews." on public.reviews for insert with check (auth.check_jsonb_permission(auth.jwt(),'claims','app_metadata.claims.can_create_reviews', 'true') );
create policy "Users can delete their own reviews." on public.reviews for delete using (auth.uid() = author_id);


-- This function recalculates the average rating and review count for a provider.
create function public.update_provider_rating()
returns trigger
language plpgsql
as $$
declare
  new_rating numeric;
  new_count integer;
begin
  select
    avg(rating),
    count(*)
  into
    new_rating,
    new_count
  from
    public.reviews
  where
    provider_id = new.provider_id;

  update public.profiles
  set
    rating = new_rating,
    reviews_count = new_count
  where
    id = new.provider_id;

  return new;
end;
$$;

-- Trigger the function after a new review is inserted.
create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_provider_rating();


-- ONE-TIME PASSWORDS
-- Table to store OTPs for phone verification.
create table public.one_time_passwords (
    id bigint primary key generated always as identity,
    phone text not null unique,
    token text not null,
    created_at timestamp with time zone not null default now()
);

-- RLS for OTP table: only service_role can access it.
alter table public.one_time_passwords enable row level security;
create policy "Allow full access to service_role" on public.one_time_passwords for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');


-- CHAT MESSAGES
-- Placeholder for chat functionality if needed later.
-- This part is not fully implemented in the UI yet.
create table public.messages (
    id bigint primary key generated always as identity,
    chat_id text not null,
    sender_id uuid not null references public.profiles(id),
    text text not null,
    created_at timestamp with time zone not null default now()
);
alter table public.messages enable row level security;
-- Define policies for messages if chat is implemented
