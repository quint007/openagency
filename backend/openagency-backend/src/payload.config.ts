import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Authors } from './collections/Authors'
import { BlogPosts } from './collections/BlogPosts'
import { Categories } from './collections/Categories'
import { Courses } from './collections/Courses'
import { Lessons } from './collections/Lessons'
import { Media } from './collections/Media'
import { Modules } from './collections/Modules'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getAdminURL, getPublicSiteURL } from './utilities/getURL'
import { isR2StorageConfigured, getR2StorageEndpoint } from './utilities/mediaStorage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const r2StorageEnabled = isR2StorageConfigured()
const r2StorageEndpoint = getR2StorageEndpoint()

if (process.env.OPENAGENCY_REQUIRE_R2_STORAGE === 'true' && !r2StorageEnabled) {
  throw new Error(
    'R2 storage is required in production. Set R2_ACCESS_KEY_ID, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_BASE_URL, and R2_SECRET_ACCESS_KEY.',
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
    Authors,
    Media,
    Categories,
    Users,
  ],
  cors: [getAdminURL(), getPublicSiteURL()].filter(Boolean),
  globals: [Header, Footer],
  serverURL: getAdminURL(),
  plugins: [
    ...plugins,
    ...(r2StorageEnabled && r2StorageEndpoint
      ? [
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
              endpoint: r2StorageEndpoint,
              forcePathStyle: true,
              region: process.env.R2_REGION || 'auto',
            },
          }),
        ]
      : []),
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
