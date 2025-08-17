-- Enable RLS for the customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all customer records
CREATE POLICY "Enable read access for all users"
ON public.customers
FOR SELECT
USING (true);
