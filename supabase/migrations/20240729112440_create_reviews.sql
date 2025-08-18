-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    "providerId" INTEGER NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    "authorName" VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to reviews" ON public.reviews
FOR SELECT USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews
FOR INSERT TO authenticated WITH CHECK (true);
