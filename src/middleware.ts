
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Diagnostic Log: Check environment variables available to the middleware.
  console.log('--- Middleware Executing ---');
  console.log('Middleware - NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded' : 'MISSING');
  console.log('Middleware - NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'MISSING');
  console.log('--------------------------');
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - login (and its sub-paths like /login/verify)
     * - register
     * This prevents the middleware from running on these paths during the auth flow.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|login|register).*)',
  ],
}
