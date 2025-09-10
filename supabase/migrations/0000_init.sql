-- Create the users table, linking to auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE NOT NULL,
    account_type character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create the providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id bigserial PRIMARY KEY,
    user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE NOT NULL,
    service character varying NOT NULL,
    location character varying NOT NULL,
    bio text NOT NULL,
    category_slug character varying NOT NULL,
    service_slug character varying NOT NULL,
    rating real DEFAULT 0 NOT NULL,
    reviews_count integer DEFAULT 0 NOT NULL,
    profile_image jsonb,
    portfolio jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id bigserial PRIMARY KEY,
    user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    customer_name character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Providers
CREATE POLICY "Providers are publicly visible" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can insert their own profile" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Customers
CREATE POLICY "Customers are not publicly visible" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can insert their own profile" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Reviews
CREATE POLICY "Reviews are publicly visible" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
