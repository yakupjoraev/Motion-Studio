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
  /*
   * No retries anywhere — ADR-337. Five consecutive full runs produced zero flakes, and every flake
   * this suite has ever produced was one defect wearing seven hats: a value read before the state
   * that produces it had settled. A retry cannot tell that from noise, so it hid two of them in CI.
   */
  retries: 0,
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
     * PERFORMANCE.md were measured there and a budget is only comparable to itself — ADR-280. The
     * other two run the flows and the **a11y** specs: focus order, focus restoration and the
     * keyboard maps are exactly where engines differ, so a single-browser accessibility pass proves
     * one browser's accessibility (ADR-329).
     */
    {
      name: 'firefox',
      testMatch: ['**/flows/*.spec.ts', '**/a11y/*.spec.ts'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: ['**/flows/*.spec.ts', '**/a11y/*.spec.ts'],
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
