import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  canAccessAdminArea,
  canAccessOwnerArea,
  canAccessPublisherArea,
  canAccessSuperAdminArea,
  getDefaultAppPath,
  type AppRole,
} from '@/lib/auth/authz'

const PUBLIC_FILE = /\.[^/]+$/

type ContentSecurityPolicyOptions = {
  allowUnsafeEval?: boolean
}

export function createContentSecurityPolicy(
  nonce: string,
  options: ContentSecurityPolicyOptions = {}
) {
  const scriptSrc = [`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`]
  if (options.allowUnsafeEval ?? process.env.NODE_ENV !== 'production') {
    scriptSrc.push("'unsafe-eval'")
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    scriptSrc.join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.sentry.io https://*.posthog.com https://*.i.posthog.com",
  ].join('; ')
}

function createRequestHeaders(request: NextRequest, nonce: string, csp: string) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)
  return requestHeaders
}

function createNextResponse(requestHeaders: Headers, csp: string) {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

function redirectWithContentSecurityPolicy(url: URL, csp: string) {
  const response = NextResponse.redirect(url)
  response.headers.set('Content-Security-Policy', csp)
  return response
}

function shouldBypassProxy(pathname: string) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/__nextjs_font/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    PUBLIC_FILE.test(pathname)
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldBypassProxy(pathname)) {
    return NextResponse.next()
  }

  const nonce = btoa(crypto.randomUUID())
  const contentSecurityPolicy = createContentSecurityPolicy(nonce)
  const requestHeaders = createRequestHeaders(request, nonce, contentSecurityPolicy)
  let supabaseResponse = createNextResponse(requestHeaders, contentSecurityPolicy)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          requestHeaders.set('cookie', request.cookies.toString())
          supabaseResponse = createNextResponse(requestHeaders, contentSecurityPolicy)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session so it doesn't expire mid-visit.
  // IMPORTANT: Do not add logic between createServerClient and getUser that
  // could prevent the session from refreshing correctly.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/admin', '/super-admin', '/owner', '/change-password']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return redirectWithContentSecurityPolicy(url, contentSecurityPolicy)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, force_password_change')
      .eq('id', user.id)
      .single()

    const role = profile?.role as AppRole | undefined

    if (profile?.force_password_change && pathname !== '/change-password') {
      const url = request.nextUrl.clone()
      url.pathname = '/change-password'
      return redirectWithContentSecurityPolicy(url, contentSecurityPolicy)
    }

    if (!role) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return redirectWithContentSecurityPolicy(url, contentSecurityPolicy)
    }

    if (pathname.startsWith('/owner') && !canAccessOwnerArea(role)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultAppPath(role)
      return redirectWithContentSecurityPolicy(url, contentSecurityPolicy)
    }

    if (pathname.startsWith('/super-admin') && !canAccessSuperAdminArea(role)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultAppPath(role)
      return redirectWithContentSecurityPolicy(url, contentSecurityPolicy)
    }

    if (pathname.startsWith('/admin') && !canAccessAdminArea(role)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultAppPath(role)
      return redirectWithContentSecurityPolicy(url, contentSecurityPolicy)
    }

    if (pathname.startsWith('/dashboard') && !canAccessPublisherArea(role)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultAppPath(role)
      return redirectWithContentSecurityPolicy(url, contentSecurityPolicy)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|__nextjs_font|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
