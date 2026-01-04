import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './lib/supabase/client'

export async function middleware(request: NextRequest) {
  // Create an initial response - this is CRITICAL
  // We will mutate this response to set cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // CRITICAL: Set on BOTH request and response
          // Force secure to false in development (localhost = http)
          request.cookies.set({
            name,
            value,
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
          response.cookies.set({
            name,
            value,
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: CookieOptions) {
          // CRITICAL: Remove from BOTH request and response
          // Force secure to false in development (localhost = http)
          request.cookies.set({
            name,
            value: '',
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
        },
      },
    }
  )

  // CRITICAL: This refreshes the session and sets updated cookies
  // It will call the set() method above which updates our response object
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Middleware: Path:', request.nextUrl.pathname, 'Session:', user ? `Yes (${user.email})` : 'No')

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  const adminRoutes = ['/admin']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isAdminRoute = adminRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check for admin role on admin routes
  if (isAdminRoute && user) {
    const { data: profile } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: any; error: any }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // CRITICAL: Return the response object we created at the start
  // It now contains all the updated cookies from the set() calls above
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions (except .html)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?!html).*$).*)',
  ],
}
