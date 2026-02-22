import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Only bypass auth in local development — test environments exercise the real auth path
  // Use `=== 'development'` (not `!== 'production'`) so staging/preview/CI never bypass.
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Skip protection for login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }

  // Supabase credentials are required in production — redirect to login if missing.
  // This guards against environments where env vars are not yet configured (e.g. CI E2E runner).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Create Supabase client with cookies from request
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No authenticated user — redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (unauthenticated auth page)
     */
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ],
}
