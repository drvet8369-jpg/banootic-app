
-- Create the agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "providerPhone" TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE("providerPhone", customer_phone) -- Ensures a customer can only have one agreement request per provider
);

-- Enable Row Level Security
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
    -- Avoid duplicate policy error
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'agreements') THEN
        CREATE POLICY "Allow public read access" 
        ON public.agreements FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to insert' AND tablename = 'agreements') THEN
        CREATE POLICY "Allow authenticated users to insert" 
        ON public.agreements FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow providers to update their agreements' AND tablename = 'agreements') THEN
        CREATE POLICY "Allow providers to update their agreements" 
        ON public.agreements FOR UPDATE 
        USING (auth.jwt() ->> 'phone' = "providerPhone") 
        WITH CHECK (auth.jwt() ->> 'phone' = "providerPhone");
    END IF;
END $$;
