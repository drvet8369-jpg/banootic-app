-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying UNIQUE,
    account_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create the providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying UNIQUE,
    service character varying,
    location text,
    bio text,
    category_slug text,
    service_slug text,
    rating double precision DEFAULT 0 NOT NULL,
    reviews_count integer DEFAULT 0 NOT NULL,
    profile_image jsonb,
    portfolio jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_name character varying
);


-- Create the agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
    id bigserial PRIMARY KEY,
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp with time zone
);

-- RLS Policies (for future security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow individual users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow providers to update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);
