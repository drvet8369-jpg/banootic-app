'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

// This is an in-memory store to circumvent cross-domain cookie issues in embedded environments.
// It will only persist for the lifetime of the page. A proper solution for production
// would involve custom domains or more robust storage mechanisms if required.
const cookieStore: { [key: string]: string } = {};

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          return cookieStore[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore[name] = value;
        },
        remove(name: string, options: CookieOptions) {
          delete cookieStore[name];
        },
      },
    }
  );