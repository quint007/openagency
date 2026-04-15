import PageTemplate, { generateMetadata } from './[slug]/page'

// The root route renders via [slug]/page which calls getPayload() at render
// time. Mark it dynamic so Next.js does not attempt to statically pre-render
// it during `next build` (the database is only available at runtime).
export const dynamic = 'force-dynamic'

export default PageTemplate

export { generateMetadata }
