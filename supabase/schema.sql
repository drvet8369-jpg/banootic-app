-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    category_id bigint NOT NULL REFERENCES public.categories(id)
);

-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text,
  full_name text,
  phone text,
  -- Provider-specific fields
  category_slug text REFERENCES public.categories(slug),
  service_slug text REFERENCES public.services(slug),
  bio text,
  location text,
  profile_image_url text,
  portfolio_urls text[],
  rating numeric,
  reviews_count integer
);


-- Create a table for reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name text,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create a table for one-time passwords
CREATE TABLE IF NOT EXISTS public.one_time_passwords (
  phone TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- Set up Row Level Security (RLS)
-- Allow public access to categories and services
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public categories are viewable by everyone." ON public.categories FOR SELECT USING (true);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public services are viewable by everyone." ON public.services FOR SELECT USING (true);

-- Allow public access to provider profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow public access to reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);
-- Allow logged-in users to insert reviews
CREATE POLICY "Users can insert their own reviews." ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- Create a function to handle new user sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, account_type, phone)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'account_type',
    new.phone
  );
  -- If the user is a provider, update their profile with provider-specific info
  IF new.raw_user_meta_data->>'account_type' = 'provider' THEN
      UPDATE public.profiles
      SET
        category_slug = new.raw_user_meta_data->>'category_slug',
        service_slug = new.raw_user_meta_data->>'service_slug',
        bio = new.raw_user_meta_data->>'bio',
        location = new.raw_user_meta_data->>'location'
      WHERE id = new.id;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to update provider rating
CREATE OR REPLACE FUNCTION public.update_provider_rating(provider_uuid uuid)
RETURNS void AS $$
DECLARE
    avg_rating numeric;
    count_reviews integer;
BEGIN
    -- Calculate the new average rating and count
    SELECT 
        AVG(rating),
        COUNT(*)
    INTO 
        avg_rating,
        count_reviews
    FROM 
        public.reviews
    WHERE 
        provider_id = provider_uuid;

    -- Update the profiles table
    UPDATE public.profiles
    SET 
        rating = avg_rating,
        reviews_count = count_reviews
    WHERE 
        id = provider_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create a function for full-text search on providers
CREATE OR REPLACE FUNCTION public.search_providers(search_term text)
RETURNS TABLE (
    id uuid,
    account_type text,
    full_name text,
    service_description text,
    bio text,
    location text,
    phone text,
    category_slug text,
    service_slug text,
    rating numeric,
    reviews_count integer,
    profile_image_url text,
    portfolio_urls text[],
    category_name text,
    service_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.account_type,
        p.full_name,
        s.name AS service_description,
        p.bio,
        p.location,
        p.phone,
        p.category_slug,
        p.service_slug,
        p.rating,
        p.reviews_count,
        p.profile_image_url,
        p.portfolio_urls,
        c.name AS category_name,
        s.name AS service_name
    FROM
        public.profiles p
    LEFT JOIN
        public.categories c ON p.category_slug = c.slug
    LEFT JOIN
        public.services s ON p.service_slug = s.slug
    WHERE
        p.account_type = 'provider' AND (
            p.full_name ILIKE '%' || search_term || '%' OR
            p.bio ILIKE '%' || search_term || '%' OR
            s.name ILIKE '%' || search_term || '%' OR
            c.name ILIKE '%' || search_term || '%'
        );
END;
$$ LANGUAGE plpgsql;

-- Insert static data for categories and services
-- This uses ON CONFLICT DO NOTHING to prevent errors if data already exists.

-- Categories
INSERT INTO public.categories (name, slug, description) VALUES
('خدمات زیبایی بانوان', 'beauty', 'خدمات مو، ناخن، آرایش و مراقبت از پوست توسط متخصصان محلی با استعداد.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug, description) VALUES
('آشپزی و غذای خانگی', 'cooking', 'غذاهای خانگی خوشمزه و اصیل، شیرینی‌جات و غذاهای سنتی.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug, description) VALUES
('خیاطی و طراحی مد', 'tailoring', 'لباس‌های سفارشی، تعمیرات و طراحی‌های مد منحصر به فرد از بوتیک‌های محلی.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.categories (name, slug, description) VALUES
('صنایع دستی و تزئینی', 'handicrafts', 'کاردستی‌های دکوری، هنرهای تزئینی و محصولات دست‌ساز منحصر به فرد.') ON CONFLICT (slug) DO NOTHING;

-- Services for Beauty
INSERT INTO public.services (name, slug, category_id) VALUES
('خدمات ناخن', 'manicure-pedicure', 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('خدمات مو', 'haircut-coloring', 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('پاکسازی پوست', 'facial-treatment', 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('آرایش صورت', 'makeup', 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('اپیلاسیون', 'waxing', 1) ON CONFLICT (slug) DO NOTHING;

-- Services for Cooking
INSERT INTO public.services (name, slug, category_id) VALUES
('غذای سنتی', 'traditional-food', 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('کیک و شیرینی', 'cakes-sweets', 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('غذای گیاهی', 'vegetarian-vegan', 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('فینگرفود', 'finger-food', 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('نان خانگی', 'homemade-bread', 2) ON CONFLICT (slug) DO NOTHING;

-- Services for Tailoring
INSERT INTO public.services (name, slug, category_id) VALUES
('دوخت سفارشی لباس', 'custom-clothing', 3) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('مزون، لباس عروس و مجلسی', 'fashion-design-mezon', 3) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('تعمیرات تخصصی لباس', 'clothing-repair', 3) ON CONFLICT (slug) DO NOTHING;

-- Services for Handicrafts
INSERT INTO public.services (name, slug, category_id) VALUES
('زیورآلات دست‌ساز', 'handmade-jewelry', 4) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('سفال تزئینی', 'decorative-pottery', 4) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('بافتنی‌ها', 'termeh-kilim', 4) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('چرم‌دوزی', 'leather-crafts', 4) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.services (name, slug, category_id) VALUES
('شمع‌سازی', 'candles-soaps', 4) ON CONFLICT (slug) DO NOTHING;