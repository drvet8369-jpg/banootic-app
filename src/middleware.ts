
import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { logToFile } from './lib/logger';

/**
 * Global middleware
 * مسئول:
 * - خواندن کوکی‌های Supabase
 * - refresh کردن session در صورت نیاز
 * - تزریق session معتبر به request های بعدی
 */
export async function middleware(request: NextRequest) {
  await logToFile(`\n--- New Request ---`);
  await logToFile(`Middleware triggered for path: ${request.nextUrl.pathname}`);
  const response = await updateSession(request);
  const supabase = createClient(request.cookies, response.cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await logToFile(`Middleware: Session found for user ID: ${user.id}`);
  } else {
    await logToFile(`Middleware: No active session found.`);
  }

  return response;
}

/**
 * matcher:
 * - همه مسیرها را پوشش می‌دهد
 * - فایل‌های استاتیک و image و favicon را رد می‌کند
 * - server actions و صفحات auth را شامل می‌شود
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|debug-log.txt).*)',
  ],
}

// Helper function to create a Supabase client within middleware
function createClient(requestCookies: any, responseCookies: any) {
    const { createServerClient } = require('@supabase/ssr');
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return requestCookies.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    responseCookies.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    responseCookies.set({ name, value: '', ...options });
                },
            },
        }
    );
}
