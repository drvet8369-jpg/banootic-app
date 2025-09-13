--  종합 بانوتیک 앱 스키마
-- 이 스크립트는 오래된 오브젝트를 모두 삭제하고 전체 데이터베이스 구조를 새로 생성합니다.
-- 여러 번 실행해도 안전합니다(idempotent).

-- 단계 1: 오래된 오브젝트 모두 삭제 (순서가 중요합니다)

-- 오래된 트리거 삭제 (auth.users 테이블에 있음)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 오래된 함수 삭제
DROP FUNCTION IF EXISTS public.create_user_profile();

-- 오래된 정책(Policy) 삭제
-- profiles 테이블 정책
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
-- reviews 테이블 정책
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated users to insert reviews" ON public.reviews;
-- categories 테이블 정책
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
-- services 테이블 정책
DROP POLICY IF EXISTS "Allow public read access to services" ON public.services;

-- 오래된 테이블 삭제 (CASCADE를 사용하여 관련된 모든 것을 삭제)
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.one_time_passwords;


-- 단계 2: 새 구조 생성

-- categories 테이블 (خدمات의 대분류)
CREATE TABLE public.categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT
);
COMMENT ON TABLE public.categories IS 'Main categories for services in the Banutik app.';

-- services 테이블 (각 카테고리에 속한 하위 서비스)
CREATE TABLE public.services (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id BIGINT NOT NULL REFERENCES public.categories(id)
);
COMMENT ON TABLE public.services IS 'Specific services offered within each category.';

-- profiles 테이블 (모든 사용자 - 고객 및 제공자)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type TEXT NOT NULL DEFAULT 'customer', -- 'customer' 또는 'provider'
    full_name TEXT,
    phone TEXT UNIQUE,
    bio TEXT,
    location TEXT,
    profile_image_url TEXT,
    service_id BIGINT REFERENCES public.services(id), -- 제공자만 해당
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Profile information for all users, linked to auth.users.';

-- reviews 테이블 (고객 리뷰)
CREATE TABLE public.reviews (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id UUID NOT NULL REFERENCES public.profiles(id),
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.reviews IS 'Stores reviews and ratings submitted by customers for providers.';

-- one_time_passwords 테이블 (OTP 인증용)
CREATE TABLE public.one_time_passwords (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  phone TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.one_time_passwords IS 'Stores temporary OTPs for phone verification.';


-- 단계 3: Row Level Security (RLS) 활성화

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
-- one_time_passwords 테이블은 서버에서만 접근하므로 RLS가 필요 없습니다.


-- 단계 4: RLS 정책(Policy) 생성

-- categories 정책
CREATE POLICY "Allow public read access to categories"
ON public.categories FOR SELECT
USING (true);

-- services 정책
CREATE POLICY "Allow public read access to services"
ON public.services FOR SELECT
USING (true);

-- profiles 정책
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- reviews 정책
CREATE POLICY "Allow public read access to reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to insert reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.role() = 'authenticated');


-- 단계 5: auth.users 테이블에 새 사용자가 추가될 때 profiles 테이블에 자동으로 행을 생성하는 함수 및 트리거

-- 이 함수는 새 auth.user가 생성될 때마다 실행됩니다.
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name, account_type)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'account_type'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거를 연결합니다.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- 단계 6: 정적 데이터 삽입 (카테고리 및 서비스)

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
