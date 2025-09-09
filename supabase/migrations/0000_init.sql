
-- Create the users table
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying UNIQUE,
    account_type character varying,
    created_at timestamp with time zone DEFAULT now()
);

-- Create the providers table
CREATE TABLE public.providers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying,
    service character varying,
    location character varying,
    bio text,
    category_slug character varying,
    service_slug character varying,
    rating real DEFAULT 0,
    reviews_count integer DEFAULT 0,
    profile_image jsonb,
    portfolio jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Create the customers table
CREATE TABLE public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- Create the reviews table
CREATE TABLE public.reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_name character varying,
    rating integer,
    comment text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create the agreements table
CREATE TABLE public.agreements (
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

-- Create Policies for users
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create Policies for providers
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Allow provider to update their own profile" ON public.providers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create Policies for customers
CREATE POLICY "Allow users to see their own customer entry" ON public.customers FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Create Policies for reviews
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- Create Policies for agreements
CREATE POLICY "Allow customers to read their agreements" ON public.agreements FOR SELECT TO authenticated USING ((SELECT auth.jwt()->>'phone') = customer_phone);
CREATE POLICY "Allow providers to read their agreements" ON public.agreements FOR SELECT TO authenticated USING ((SELECT auth.jwt()->>'phone') = provider_phone);
CREATE POLICY "Allow customers to create agreements" ON public.agreements FOR INSERT TO authenticated WITH CHECK ((SELECT auth.jwt()->>'phone') = customer_phone);
CREATE POLICY "Allow providers to update their agreements" ON public.agreements FOR UPDATE USING ((SELECT auth.jwt()->>'phone') = provider_phone);
