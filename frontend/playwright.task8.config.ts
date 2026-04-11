import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../frontend/apps/courses/tests/e2e',
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  reporter: 'list',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
});
