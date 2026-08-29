import { defineConfig, devices } from '@playwright/test'

const CI = process.env['CI'] === 'true' || process.env['CI'] === '1'

/**
 * The exported project, not this repository — DEVOPS.md § Export smoke test. It is a separate config
 * because everything about the run is different: the server is the user's `npm start` rather than
 * ours, the port is not the studio's, and a normal `pnpm test:e2e` must not try to open a page that
 * only exists after an export.
 *
 * ```
 * pnpm generate:export-fixture --document export-landing --target next --out ../exported
 * cd ../exported && npm install && npm run build
 * EXPORT_DIR=../exported pnpm --filter e2e test:e2e:export
 * ```
 */
const EXPORT_DIR = process.env['EXPORT_DIR'] ?? '../exported'
const PORT = process.env['EXPORT_PORT'] ?? '3100'

export default defineConfig({
  testDir: './export-smoke',
  fullyParallel: false,
  forbidOnly: CI,
  retries: 0,
  workers: 1,
  reporter: CI ? [['github'], ['list']] : [['list']],
  timeout: 60_000,

  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],

  webServer: {
    command: `npm start -- --port ${PORT}`,
    cwd: EXPORT_DIR,
    url: `http://localhost:${PORT}`,
    // Unconditional, unlike the studio's: the exported server is started by the workflow so that
    // Lighthouse can measure the same process these specs then assert against.
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
