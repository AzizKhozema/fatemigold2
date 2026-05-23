import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES     = ['/login']
const ADMIN_ROUTES      = ['/dashboard', '/inventory', '/sales', '/customers', '/billing', '/employees', '/labour', '/workflow', '/reports', '/ai-generator', '/design', '/wages']
const SUPERVISOR_ROUTES = ['/supervisor']
const WORKER_ROUTES     = ['/worker']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/manifest') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Not logged in — redirect to login
  if (!session) {
    if (PUBLIC_ROUTES.includes(pathname)) {
      return response
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in — get role from employees table
  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  const role = employee?.role ?? 'worker'

  // Already on login — redirect to correct home
  if (pathname === '/login' || pathname === '/') {
    if (role === 'admin')      return NextResponse.redirect(new URL('/dashboard', request.url))
    if (role === 'supervisor') return NextResponse.redirect(new URL('/supervisor', request.url))
    if (role === 'worker')     return NextResponse.redirect(new URL('/worker', request.url))
  }

  // Wrong section for role
  if (role === 'worker') {
    const allowed = WORKER_ROUTES.some(r => pathname.startsWith(r))
    if (!allowed) return NextResponse.redirect(new URL('/worker', request.url))
  }

  if (role === 'supervisor') {
    const inAdmin = ADMIN_ROUTES.some(r => pathname.startsWith(r))
    const inWorker = WORKER_ROUTES.some(r => pathname.startsWith(r))
    if (inAdmin || inWorker) {
      return NextResponse.redirect(new URL('/supervisor', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|manifest|sw.js|workbox).*)',
  ],
}