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

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
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

  const { pathname } = request.nextUrl

  const protectedPaths = ['/dashboard', '/admin', '/super-admin', '/owner', '/change-password']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
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
      return NextResponse.redirect(url)
    }

    if (!role) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/owner') && !canAccessOwnerArea(role)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultAppPath(role)
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/super-admin') && !canAccessSuperAdminArea(role)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultAppPath(role)
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/admin') && !canAccessAdminArea(role)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultAppPath(role)
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/dashboard') && !canAccessPublisherArea(role)) {
      const url = request.nextUrl.clone()
      url.pathname = getDefaultAppPath(role)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
