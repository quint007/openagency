import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '../frontend/apps/marketing/tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: 'pnpm --dir apps/marketing dev',
    reuseExistingServer: true,
    url: 'http://127.0.0.1:3000',
  },
})
