
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // updateSession() handles reading the request cookies, refreshing the session,
  // and setting new cookies in the response.
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /login (and its sub-pages like /login/verify)
     * - /register
     * - /api (API routes)
     * This prevents the middleware from running on public auth pages,
     * solving the race condition after OTP verification.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|api).*)',
  ],
}
