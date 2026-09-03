import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig, type PayloadRequest } from 'payload'
import sharp from 'sharp'

import { defaultLexical } from '@/fields/defaultLexical'
import { usersOnly } from './access/usersOnly'
import { ApiClients } from './collections/ApiClients'
import { Authors } from './collections/Authors'
import { BlogPosts } from './collections/BlogPosts'
import { Categories } from './collections/Categories'
import { Courses } from './collections/Courses'
import { LegalDocuments } from './collections/LegalDocuments'
import { Lessons } from './collections/Lessons'
import { Media } from './collections/Media'
import { Modules } from './collections/Modules'
import { NewsletterConsentEvents } from './collections/NewsletterConsentEvents'
import { NewsletterRequestLimits } from './collections/NewsletterRequestLimits'
import { NewsletterSubscriptions } from './collections/NewsletterSubscriptions'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { ToolSubmissions } from './collections/ToolSubmissions'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { getNewsletterConfigurationError } from './newsletter/constants'
import { plugins } from './plugins'
import { getAdminURL, getPublicSiteURL } from './utilities/getURL'
import { getR2StorageDiagnostics, getR2StorageEndpoint, isR2StorageConfigured } from './utilities/mediaStorage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const r2StorageEnabled = isR2StorageConfigured()
const r2StorageEndpoint = getR2StorageEndpoint()
const r2StorageDiagnostics = getR2StorageDiagnostics()
const newsletterConfigurationError = getNewsletterConfigurationError()

if (process.env.OPENAGENCY_REQUIRE_R2_STORAGE === 'true' && !r2StorageEnabled) {
  throw new Error(
    `R2 storage is required in production but is misconfigured: ${r2StorageDiagnostics.error}`,
  )
}

if (newsletterConfigurationError) {
  throw new Error(newsletterConfigurationError)
}

if (r2StorageEnabled && r2StorageDiagnostics.bucket && r2StorageDiagnostics.endpointHost) {
  console.info(
    `R2 media storage configured for bucket ${r2StorageDiagnostics.bucket} at ${r2StorageDiagnostics.endpointHost}.`,
  )
}

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromAddress: 'no-reply@open-agency.io',
    defaultFromName: 'Open Agency',
  }),
  collections: [
    Pages,
    Posts,
    BlogPosts,
    Courses,
    Modules,
    Lessons,
    LegalDocuments,
    Authors,
    Media,
    Categories,
    Users,
    ApiClients,
    ToolSubmissions,
    NewsletterSubscriptions,
    NewsletterConsentEvents,
    NewsletterRequestLimits,
  ],
  cors: [getAdminURL(), getPublicSiteURL()].filter(Boolean),
  globals: [Header, Footer],
  serverURL: getAdminURL(),
  plugins: [
    ...plugins,
    mcpPlugin({
      collections: {
        'blog-posts': { enabled: true },
      },
      overrideApiKeyCollection: (collection) => ({
        ...collection,
        access: {
          ...collection.access,
          admin: usersOnly,
          create: usersOnly,
          delete: usersOnly,
          read: usersOnly,
          update: usersOnly,
        },
      }),
    }),
    s3Storage({
      acl: 'public-read',
      bucket: process.env.R2_BUCKET || '',
      collections: {
        [Media.slug]: true,
      },
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        endpoint: r2StorageEndpoint || 'https://r2-storage-unconfigured.invalid',
        forcePathStyle: true,
        region: process.env.R2_REGION || 'auto',
      },
      enabled: Boolean(r2StorageEnabled && r2StorageEndpoint),
    }),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
