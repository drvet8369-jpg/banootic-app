
import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Global middleware
 * مسئول:
 * - خواندن کوکی‌های Supabase
 * - refresh کردن session در صورت نیاز
 * - تزریق session معتبر به request های بعدی
 */
export async function middleware(request: NextRequest) {
  return updateSession(request)
}

/**
 * matcher:
 * - همه مسیرها را پوشش می‌دهد
 * - فایل‌های استاتیک و image و favicon را رد می‌کند
 * - server actions و صفحات auth را شامل می‌شود
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
