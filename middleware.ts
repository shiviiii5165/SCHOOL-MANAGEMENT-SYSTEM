import { NextRequest, NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
const { auth } = NextAuth(authConfig)
import { detectAttack } from '@/lib/security/botDetection'
import { checkLoginRateLimit } from '@/lib/security/rateLimiter'

// Role -> allowed path prefixes
const ROLE_PATHS: Record<string, string[]> = {
  ADMIN:   ['/admin'],
  TEACHER: ['/teacher'],
  STUDENT: ['/student'],
  PARENT:  ['/parent'],
}

// Public paths (no auth needed)
const PUBLIC_PATHS = [
  '/login', '/forgot-password', '/reset-password',
  '/api/auth', '/_next', '/favicon', '/icons', '/manifest',
  '/offline', '/sw.js',
]

// Simple bot detection
function isSuspiciousBot(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') ?? ''
  const suspiciousPatterns = [
    /sqlmap/i, /nikto/i, /nessus/i, /masscan/i,
    /zgrab/i,  /dirbuster/i, /gobuster/i,
  ]
  return suspiciousPatterns.some(p => p.test(ua))
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (
    pathname === '/api/auth/callback/credentials' &&
    req.method === 'POST'
  ) {
    const ip = req.headers.get('x-forwarded-for')
             ?? req.headers.get('x-real-ip')
             ?? req.ip
             ?? 'unknown'

    let email = 'unknown'
    try {
      const body  = await req.text()
      const params = new URLSearchParams(body)
      email = params.get('email') ?? 'unknown'
    } catch {}

    const identifier = `${ip}:${email.toLowerCase()}`
    const limit      = checkLoginRateLimit(identifier)

    if (!limit.allowed) {
      if (req.headers.get('accept')?.includes('application/json')) {
        return NextResponse.json(
          { error: `Too many login attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
        )
      }
      const url = new URL('/login', req.url)
      url.searchParams.set('error', 'RateLimited')
      url.searchParams.set('retryAfter', String(Math.ceil(limit.retryAfterSeconds / 60)))
      return NextResponse.redirect(url)
    }
  }

  // Block known attack tools immediately
  if (isSuspiciousBot(req)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const attackCheck = detectAttack(req)
  if (attackCheck.attack) {
    console.warn(`[SECURITY] Blocked attack from ${req.ip}: ${attackCheck.reason}`)
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Get session
  const session = await auth()

  // Not authenticated
  if (!session?.user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const role    = session.user.role as string
  const allowed = ROLE_PATHS[role] ?? []

  // Check if accessing correct role path
  const isDashboardPath = Object.values(ROLE_PATHS).flat()
    .some(p => pathname.startsWith(p))

  if (isDashboardPath && !allowed.some(p => pathname.startsWith(p))) {
    // Redirect to correct dashboard instead of 403
    const correctPath = allowed[0] ?? '/login'
    return NextResponse.redirect(new URL(correctPath, req.url))
  }

  // Add security headers to response
  const response = NextResponse.next()
  response.headers.set('X-User-Role', role)  // useful for debugging
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
