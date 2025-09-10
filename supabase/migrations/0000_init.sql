
-- Create the users table
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name character varying,
    phone character varying UNIQUE,
    account_type character varying,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Create the providers table
CREATE SEQUENCE public.providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.providers (
    id integer NOT NULL PRIMARY KEY DEFAULT nextval('public.providers_id_seq'::regclass),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers are viewable by everyone" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers can update their own profile" ON public.providers FOR UPDATE USING (auth.uid() = user_id);

-- Create the reviews table
CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.reviews (
    id integer NOT NULL PRIMARY KEY DEFAULT nextval('public.reviews_id_seq'::regclass),
    provider_id integer NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer,
    comment text,
    customer_name character varying,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create the agreements table
CREATE SEQUENCE public.agreements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.agreements (
    id integer NOT NULL PRIMARY KEY DEFAULT nextval('public.agreements_id_seq'::regclass),
    customer_phone character varying NOT NULL,
    provider_phone character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    requested_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone
);
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agreements" ON public.agreements FOR SELECT USING (((SELECT auth.jwt() ->> 'phone'::text) = customer_phone) OR ((SELECT auth.jwt() ->> 'phone'::text) = provider_phone));
CREATE POLICY "Customers can create agreements" ON public.agreements FOR INSERT WITH CHECK (((SELECT auth.jwt() ->> 'phone'::text) = customer_phone));
CREATE POLICY "Providers can update their own agreements" ON public.agreements FOR UPDATE USING ((SELECT auth.jwt() ->> 'phone'::text) = provider_phone);

-- Set sequence ownership
ALTER SEQUENCE public.providers_id_seq OWNED BY public.providers.id;
ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;
ALTER SEQUENCE public.agreements_id_seq OWNED BY public.agreements.id;
