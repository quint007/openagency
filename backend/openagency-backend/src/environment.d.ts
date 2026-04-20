declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ALPHA_BASIC_AUTH_PASSWORD?: string
      ALPHA_BASIC_AUTH_USERNAME?: string
      CRON_SECRET: string
      COURSES_APP_BASE_URL: string
      COURSES_REVALIDATE_URL?: string
      DATABASE_URL: string
      MARKETING_APP_BASE_URL: string
      MARKETING_REVALIDATE_URL?: string
      NEXT_PUBLIC_SERVER_URL: string
      PAYLOAD_SECRET: string
      RESEND_API_KEY?: string
      PREVIEW_SECRET: string
      REVALIDATE_SECRET: string
      REVALIDATE_TIMEOUT_MS?: string
      R2_ACCESS_KEY_ID?: string
      R2_BUCKET?: string
      R2_ENDPOINT?: string
      R2_PUBLIC_BASE_URL?: string
      R2_REGION?: string
      R2_SECRET_ACCESS_KEY?: string
      VERCEL_PROJECT_PRODUCTION_URL?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
