
-- =================================================================
--    SCHEMA FOR بانوتیک APP
-- =================================================================
-- This script sets up the database schema, including tables,
-- relationships, and essential security policies.
--
-- Tables created:
--   - categories: Service categories (e.g., Beauty, Cooking).
--   - services: Specific services within categories (e.g., Manicure).
--   - profiles: Stores public user data for both customers and providers,
--               linked to Supabase's internal auth.users table.
--   - reviews: Customer reviews and ratings for providers.
--   - one_time_passwords: Temporarily stores OTPs for phone-based login.
--
-- Functions created:
--   - handle_new_user: A trigger function to automatically create a
--                      profile entry when a new user signs up in Supabase Auth.
-- =================================================================


-- Step 1: Create the tables
-- --------------------------

-- Table for service categories
CREATE TABLE public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text
);

-- Table for specific services
CREATE TABLE public.services (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL,
    category_id bigint NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    UNIQUE (slug, category_id)
);

-- Table for user profiles (customers and providers)
-- This table is linked to the auth.users table in Supabase
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text UNIQUE,
    account_type text NOT NULL DEFAULT 'customer', -- 'customer' or 'provider'
    bio text,
    location text,
    profile_image_url text,
    -- Provider-specific fields
    service_id bigint REFERENCES public.services(id) ON DELETE SET NULL,
    rating numeric(2, 1) DEFAULT 0.0,
    reviews_count integer DEFAULT 0,
    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for reviews
CREATE TABLE public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for one-time passwords (OTP)
CREATE TABLE public.one_time_passwords (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    phone text NOT NULL UNIQUE,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- Step 2: Create trigger function to link auth.users and public.profiles
-- --------------------------------------------------------------------------
-- This function automatically creates a new row in public.profiles
-- whenever a new user is created in the auth.users table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, account_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.phone,
    NEW.raw_user_meta_data->>'account_type'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger that executes the function after a new user is inserted
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Step 3: Set up Row Level Security (RLS) policies
-- -------------------------------------------------
-- Enable RLS for all relevant tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for 'categories'
CREATE POLICY "Allow public read access to categories"
ON public.categories FOR SELECT
USING (true);

-- Policies for 'services'
CREATE POLICY "Allow public read access to services"
ON public.services FOR SELECT
USING (true);

-- Policies for 'profiles'
CREATE POLICY "Allow public read access to profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Allow individual update access for profiles"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Policies for 'reviews'
CREATE POLICY "Allow public read access to reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.role() = 'authenticated');


-- Step 4: Insert initial data into categories and services
-- ---------------------------------------------------------
-- This data populates the app with the necessary service listings.

INSERT INTO public.categories (name, slug, description) VALUES
('خدمات زیبایی بانوان', 'beauty', 'خدمات مو، ناخن، آرایش و مراقبت از پوست توسط متخصصان محلی با استعداد.'),
('آشپزی و غذای خانگی', 'cooking', 'غذاهای خانگی خوشمزه و اصیل، شیرینی‌جات و غذاهای سنتی.'),
('خیاطی و طراحی مد', 'tailoring', 'لباس‌های سفارشی، تعمیرات و طراحی‌های مد منحصر به فرد از بوتیک‌های محلی.'),
('صنایع دستی و تزئینی', 'handicrafts', 'کاردستی‌های دکوری، هنرهای تزئینی و محصولات دست‌ساز منحصر به فرد.');

INSERT INTO public.services (name, slug, category_id) VALUES
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

