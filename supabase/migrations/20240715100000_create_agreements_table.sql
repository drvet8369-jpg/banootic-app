-- supabase/migrations/YYYYMMDDHHMMSS_create_agreements_table.sql

CREATE TABLE IF NOT EXISTS public.agreements (
    id SERIAL PRIMARY KEY,
    customer_phone VARCHAR(20) NOT NULL,
    provider_phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);
