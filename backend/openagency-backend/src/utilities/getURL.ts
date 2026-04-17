import canUseDOM from './canUseDOM'

type PublicCollectionSlug =
  | 'authors'
  | 'blog-posts'
  | 'categories'
  | 'courses'
  | 'lessons'
  | 'media'
  | 'modules'
  | 'pages'
  | 'posts'
  | 'users'

const COLLECTION_ROUTE_PREFIXES: Record<PublicCollectionSlug, string | null> = {
  authors: '/authors',
  'blog-posts': '/blog',
  categories: '/categories',
  courses: '/courses',
  lessons: '/lessons',
  media: null,
  modules: '/modules',
  pages: '',
  posts: '/posts',
  users: null,
}

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '')

const trimLeadingSlash = (value: string): string => value.replace(/^\/+/, '')

const normalizeBaseUrl = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim()

  return trimmed ? trimTrailingSlash(trimmed) : undefined
}

export const isAbsoluteUrl = (value: string): boolean => /^[a-z][a-z\d+\-.]*:\/\//i.test(value)

export const joinUrl = (baseUrl: string, path: string): string => {
  if (!path || path === '/') {
    return trimTrailingSlash(baseUrl)
  }

  return `${trimTrailingSlash(baseUrl)}/${trimLeadingSlash(path)}`
}

export const getAdminURL = () => {
  return (
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SERVER_URL) ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  )
}

export const getPublicSiteURL = () => {
  return normalizeBaseUrl(process.env.MARKETING_APP_BASE_URL) || getAdminURL()
}

export const getServerSideURL = () => getAdminURL()

export const getPublicCollectionUrl = (args: {
  collectionSlug?: null | string
  slug?: null | string
}): string => {
  const baseUrl = getPublicSiteURL()
  const collectionSlug = args.collectionSlug as PublicCollectionSlug | undefined
  const routePrefix = collectionSlug ? COLLECTION_ROUTE_PREFIXES[collectionSlug] : undefined
  const normalizedSlug = args.slug?.trim()

  if (routePrefix === null) {
    return baseUrl
  }

  if (collectionSlug === 'pages') {
    if (!normalizedSlug || normalizedSlug === 'home') {
      return baseUrl
    }

    return joinUrl(baseUrl, normalizedSlug)
  }

  if (!normalizedSlug) {
    return routePrefix ? joinUrl(baseUrl, routePrefix) : baseUrl
  }

  const relativePath = routePrefix ? `${routePrefix}/${normalizedSlug}` : normalizedSlug

  return joinUrl(baseUrl, relativePath)
}

export const toAbsoluteUrl = (
  url: string | null | undefined,
  baseUrl = getPublicSiteURL(),
): string => {
  if (!url) return joinUrl(baseUrl, '/website-template-OG.webp')

  return isAbsoluteUrl(url) ? url : joinUrl(baseUrl, url)
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return normalizeBaseUrl(process.env.NEXT_PUBLIC_SERVER_URL) || ''
}
