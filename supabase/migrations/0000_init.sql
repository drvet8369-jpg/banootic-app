
-- Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying NOT NULL,
    phone character varying UNIQUE,
    account_type character varying,
    created_at timestamp with time zone DEFAULT now()
);

-- Create Providers Table
CREATE TABLE IF NOT EXISTS public.providers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying UNIQUE,
    service character varying,
    location text,
    bio text,
    category_slug text,
    service_slug text,
    rating real DEFAULT 0,
    reviews_count integer DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb[],
    created_at timestamp with time zone DEFAULT now()
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id bigint REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL,
    comment text,
    customer_name character varying,
    created_at timestamp with time zone DEFAULT now()
);

-- Create Agreements Table
CREATE TABLE IF NOT EXISTS public.agreements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status character varying DEFAULT 'pending',
    requested_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone
);


-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- Policies for USERS table
CREATE POLICY "Users can view all other users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own user record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own user record" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for PROVIDERS table
CREATE POLICY "Anyone can view providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can insert their own record" ON public.providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update their own record" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Policies for CUSTOMERS table
CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Customers can insert their own record" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers can update their own record" ON public.customers FOR UPDATE USING (auth.uid() = user_id);

-- Policies for REVIEWS table
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for AGREEMENTS table
CREATE POLICY "Users can view their own agreements" ON public.agreements FOR SELECT USING (((SELECT auth.jwt()->>'phone'::text) = customer_phone) OR ((SELECT auth.jwt()->>'phone'::text) = provider_phone));
CREATE POLICY "Customers can create agreements" ON public.agreements FOR INSERT WITH CHECK (((SELECT auth.jwt()->>'phone'::text) = customer_phone) AND ((SELECT auth.jwt()->>'account_type'::text) = 'customer'));
CREATE POLICY "Providers can update their agreements" ON public.agreements FOR UPDATE USING ((SELECT auth.jwt()->>'phone'::text) = provider_phone);

