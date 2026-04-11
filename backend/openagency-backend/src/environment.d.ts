declare global {
  namespace NodeJS {
    interface ProcessEnv {
      COURSES_APP_BASE_URL: string
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      MARKETING_APP_BASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      REVALIDATE_SECRET: string
      REVALIDATE_TIMEOUT_MS?: string
      VERCEL_PROJECT_PRODUCTION_URL: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
