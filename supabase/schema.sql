-- بانوتیک Database Schema
-- Version 3.0: Self-contained with cleanup.

-- This script now includes cleanup commands.
-- Running this single file will first drop existing tables, policies, etc.,
-- and then create the new, correct structure.

-- Drop existing structures if they exist to prevent errors
DROP TABLE IF EXISTS "public"."reviews" CASCADE;
DROP TABLE IF EXISTS "public"."one_time_passwords" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;
DROP TABLE IF EXISTS "public"."services" CASCADE;
DROP TABLE IF EXISTS "public"."categories" CASCADE;


-- Table: categories
-- Stores the main service categories.
CREATE TABLE public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text
);

-- Table: services
-- Stores specific services under each category.
CREATE TABLE public.services (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category_id bigint NOT NULL REFERENCES public.categories(id),
    name text NOT NULL,
    slug text NOT NULL UNIQUE
);

-- Table: profiles
-- This table stores public profile data for all users (customers and providers).
-- It is linked to the main `auth.users` table.
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type text NOT NULL CHECK (account_type IN ('customer', 'provider')),
    full_name text NOT NULL,
    phone text UNIQUE,
    bio text,
    location text,
    profile_image_url text,
    service_id bigint REFERENCES public.services(id) -- Nullable, only for providers
);

-- Table: reviews
-- Stores reviews and ratings given by customers to providers.
CREATE TABLE public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: one_time_passwords
-- Stores OTPs for phone-based login.
CREATE TABLE public.one_time_passwords (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    phone text NOT NULL UNIQUE,
    token text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);


-- Enable Row-Level Security (RLS) for all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
-- one_time_passwords table does not need RLS as it's only accessed by admin/service_role.

-- RLS Policies

-- Allow public, read-only access to categories and services.
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access to services" ON public.services FOR SELECT USING (true);

-- Allow public, read-only access to profiles.
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
-- Allow users to update their own profile.
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Allow users to create their own profile entry (used during sign-up).
CREATE POLICY "Allow users to create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- Allow public read access to reviews.
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
-- Allow authenticated users to write reviews.
CREATE POLICY "Allow authenticated users to write reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Allow users to delete their own reviews.
CREATE POLICY "Allow users to delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = author_id);


-- Function to create a public profile when a new user signs up in `auth.users`.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, account_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.phone,
    NEW.raw_user_meta_data ->> 'account_type'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is created.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Seed initial data for categories and services
INSERT INTO public.categories (name, slug, description) VALUES
('خدمات زیبایی بانوان', 'beauty', 'خدمات مو، ناخن، آرایش و مراقبت از پوست توسط متخصصان محلی با استعداد.'),
('آشپزی و غذای خانگی', 'cooking', 'غذاهای خانگی خوشمزه و اصیل، شیرینی‌جات و غذاهای سنتی.'),
('خیاطی و طراحی مد', 'tailoring', 'لباس‌های سفارشی، تعمیرات و طراحی‌های مد منحصر به فرد از بوتیک‌های محلی.'),
('صنایع دستی و تزئینی', 'handicrafts', 'کاردستی‌های دکوری، هنرهای تزئینی و محصولات دست‌ساز منحصر به فرد.');

INSERT INTO public.services (category_id, name, slug) VALUES
(1, 'خدمات ناخن', 'manicure-pedicure'),
(1, 'خدمات مو', 'haircut-coloring'),
(1, 'پاکسازی پوست', 'facial-treatment'),
(1, 'آرایش صورت', 'makeup'),
(1, 'اپیلاسیون', 'waxing'),
(2, 'غذای سنتی', 'traditional-food'),
(2, 'کیک و شیرینی', 'cakes-sweets'),
(2, 'غذای گیاهی', 'vegetarian-vegan'),
(2, 'فینگرفود', 'finger-food'),
(2, 'نان خانگی', 'homemade-bread'),
(3, 'دوخت سفارشی لباس', 'custom-clothing'),
(3, 'مزون، لباس عروس و مجلسی', 'fashion-design-mezon'),
(3, 'تعمیرات تخصصی لباس', 'clothing-repair'),
(4, 'زیورآلات دست‌ساز', 'handmade-jewelry'),
(4, 'سفال تزئینی', 'decorative-pottery'),
(4, 'بافتنی‌ها', 'termeh-kilim'),
(4, 'چرم‌دوزی', 'leather-crafts'),
(4, 'شمع‌سازی', 'candles-soaps');
