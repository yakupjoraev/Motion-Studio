import { defineConfig, devices } from '@playwright/test'

const CI = process.env['CI'] === 'true' || process.env['CI'] === '1'

/**
 * TESTING.md § E2E tests. The performance specs run against a **production** build: `next dev`
 * recompiles on navigation and ships a development React, and a frame timing measured against
 * either is a measurement of the dev server.
 *
 * The browser is the installed Chrome rather than Playwright's bundled Chromium: the numbers in
 * `docs/PERFORMANCE.md` were taken in Chrome, and a budget is only comparable to itself.
 */
export default defineConfig({
  testDir: '.',
  // The exported page has its own config and its own server — `export-smoke.config.ts`.
  testIgnore: ['export-smoke/**'],
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: 1,
  reporter: CI ? [['github'], ['list']] : [['list']],
  timeout: 90_000,

  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  webServer: {
    command: 'pnpm --filter web start',
    url: 'http://localhost:3000/studio',
    reuseExistingServer: !CI,
    timeout: 120_000,
    cwd: '..',
  },
})
