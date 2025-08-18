
-- Seed an initial customer for testing purposes
INSERT INTO public.customers (name, phone, account_type)
VALUES ('مژگان جودکی', '09121111111', 'customer')
ON CONFLICT (phone) DO NOTHING;
