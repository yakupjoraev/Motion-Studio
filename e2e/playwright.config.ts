import { defineConfig, devices } from '@playwright/test'

const CI = process.env['CI'] === 'true' || process.env['CI'] === '1'

/** `next start` reads `PORT` itself, so one variable moves the server and everything that asks for it. */
const PORT = process.env['PORT'] ?? '3000'
const ORIGIN = `http://localhost:${PORT}`

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
    baseURL: ORIGIN,
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
    /*
     * TESTING.md § E2E asks for three browsers; the perf specs are Chrome-only because the budgets in
     * PERFORMANCE.md were measured there and a budget is only comparable to itself. So the other two
     * run the flows, which are the specs whose subject is behaviour rather than timing — ADR-280.
     */
    {
      name: 'firefox',
      testMatch: '**/flows/*.spec.ts',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: '**/flows/*.spec.ts',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'pnpm --filter web start',
    url: `${ORIGIN}/studio`,
    reuseExistingServer: !CI,
    timeout: 120_000,
    cwd: '..',
  },
})
