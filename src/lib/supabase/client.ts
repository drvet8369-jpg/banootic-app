'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          if (typeof window === 'undefined') {
            return undefined;
          }
          const item = localStorage.getItem(name);
          return item ? item : undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          if (typeof window === 'undefined') {
            return;
          }
          localStorage.setItem(name, value);
        },
        remove(name: string, options: CookieOptions) {
          if (typeof window === 'undefined') {
            return;
          }
          localStorage.removeItem(name);
        },
      },
    }
  );
