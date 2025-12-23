import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // update user's auth session
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /login (login flow pages)
     * - /register (registration flow pages)
     * This prevents the middleware from interfering with the auth flow.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}
