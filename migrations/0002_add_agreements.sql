-- Create the agreements table
CREATE TABLE agreements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "providerPhone" TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE("providerPhone", customer_phone) -- Ensures a customer can only have one agreement request per provider
);

-- Enable Row Level Security
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON public.agreements FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert" ON public.agreements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow providers to update their agreements" ON public.agreements FOR UPDATE USING (auth.jwt() ->> 'phone' = "providerPhone") WITH CHECK (auth.jwt() ->> 'phone' = "providerPhone");

