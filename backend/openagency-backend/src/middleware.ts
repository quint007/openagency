import { NextRequest, NextResponse } from 'next/server'

const BASIC_AUTH_REALM = 'Open Agency Alpha'

const EXCLUDED_PATH_PATTERNS = [
  /^\/_next\//,
  /^\/favicon(?:-[\w-]+)?\.(?:ico|png|svg)$/i,
  /^\/apple-touch-icon(?:-[\w-]+)?\.png$/i,
  /^\/site\.webmanifest$/i,
  /^\/robots\.txt$/i,
  /^\/sitemap(?:.*)?\.xml$/i,
]

const isStaticAssetRequest = (pathname: string): boolean => {
  if (EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true
  }

  return /\.[^/]+$/.test(pathname)
}

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const getHostname = (value: string | undefined): string | null => {
  const trimmed = value?.trim()

  if (!trimmed) return null

  try {
    return new URL(trimTrailingSlash(trimmed)).host
  } catch {
    return null
  }
}

const isAllowedAdminRoute = (pathname: string): boolean => {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/next/preview' ||
    pathname.startsWith('/next/preview/')
  )
}

const unauthorizedResponse = (): NextResponse =>
  new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${BASIC_AUTH_REALM}"`,
    },
  })

export const middleware = (request: NextRequest): NextResponse => {
  const username = process.env.ALPHA_BASIC_AUTH_USERNAME
  const password = process.env.ALPHA_BASIC_AUTH_PASSWORD
  const adminHostname = getHostname(process.env.NEXT_PUBLIC_SERVER_URL)
  const publicHostname = getHostname(process.env.MARKETING_APP_BASE_URL)
  const requestHostname = request.nextUrl.host
  const isAdminHostRequest = Boolean(adminHostname && requestHostname === adminHostname)
  const hideNonAdminRoutes = Boolean(
    isAdminHostRequest &&
    adminHostname &&
    publicHostname &&
    adminHostname !== publicHostname &&
    !isStaticAssetRequest(request.nextUrl.pathname) &&
    !isAllowedAdminRoute(request.nextUrl.pathname),
  )

  if (hideNonAdminRoutes) {
    return new NextResponse(null, { status: 404 })
  }

  if (
    !isAdminHostRequest ||
    !username ||
    !password ||
    isStaticAssetRequest(request.nextUrl.pathname)
  ) {
    return NextResponse.next()
  }

  const authorizationHeader = request.headers.get('authorization')

  if (!authorizationHeader?.startsWith('Basic ')) {
    return unauthorizedResponse()
  }

  const encodedCredentials = authorizationHeader.slice(6).trim()

  let decodedCredentials = ''

  try {
    decodedCredentials = atob(encodedCredentials)
  } catch {
    return unauthorizedResponse()
  }

  const separatorIndex = decodedCredentials.indexOf(':')

  if (separatorIndex === -1) {
    return unauthorizedResponse()
  }

  const providedUsername = decodedCredentials.slice(0, separatorIndex)
  const providedPassword = decodedCredentials.slice(separatorIndex + 1)

  if (providedUsername !== username || providedPassword !== password) {
    return unauthorizedResponse()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
