import { defineConfig, devices } from '@playwright/test'

const CI = process.env['CI'] === 'true' || process.env['CI'] === '1'

/** The frame every shot is taken in — TESTING.md § Visual regression: fixed viewport, scale 1. */
const FRAME = { width: 1440, height: 900 }

/** The built Storybook, and the studio's own server. Two origins, because two surfaces. */
const STORYBOOK_PORT = process.env['STORYBOOK_PORT'] ?? '6007'
const STUDIO_PORT = process.env['PORT'] ?? '3000'

/**
 * The visual regression suite — TESTING.md § Visual regression.
 *
 * A config of its own, like the export smoke test's, because everything about the run is different:
 * two servers rather than one, a single browser rather than three, and a snapshot comparison rather
 * than an assertion. A `pnpm test:e2e` that tried to take screenshots would fail on any machine whose
 * fonts are not the baselines'.
 *
 * **One browser on one platform.** The baselines are `linux-chromium` and are generated in CI, never
 * locally: local font rasterisation differs between machines and would churn every committed file.
 * Three engines × 144 block shots is a maintenance cost with no matching yield — the thing being
 * tested is the CSS, and the CSS does not change between engines in ways a screenshot can read.
 */
export default defineConfig({
  testDir: './visual',
  snapshotPathTemplate: '{testDir}/snapshots/{testFilePath}/{arg}{ext}',
  fullyParallel: false,
  forbidOnly: CI,
  // A screenshot that only matches on the second attempt is a screenshot nobody can trust — ADR-337
  // makes the same argument for the rest of the suite.
  retries: 0,
  workers: 1,
  reporter: CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,

  expect: {
    toHaveScreenshot: {
      /*
       * An absolute count of pixels rather than the 1 % ratio TESTING.md quoted, and the reason is a
       * measurement — ADR-340.
       *
       * At 1 % of a 1440 × 900 frame the budget is thirteen thousand pixels. Moving the radius token
       * from 16 px to 22 px — a change nobody ships by accident — repaints the corners of every card
       * and nothing else: measured at 458 to 1832 pixels, which is 0.035 % to 0.14 % of the frame.
       * The suite passed that change on all 144 block shots. A threshold that tolerates a token
       * rewrite is not a threshold, it is a formality.
       *
       * 200 is a factor of two below the smallest real change measured, and above the noise across
       * three consecutive runs, which was zero. A count rather than a ratio because that is what the
       * number means: a control's shot is 192 px wide and a block's is 1440, and "a fifth of a per
       * cent" is a different tolerance in each.
       */
      maxDiffPixels: 200,
      /*
       * How different a pixel has to be before it counts, and the default of 0.2 is why the count
       * above did nothing on its own: the corners this catches are a near-white card against a
       * near-white stage, and at 0.2 the two are "the same colour". Measured with the radius change,
       * 0.05 is what makes those pixels visible to the comparison at all.
       */
      threshold: 0.05,
      animations: 'disabled',
      scale: 'css',
    },
  },

  use: {
    /*
     * Nothing in a baseline is allowed to be mid-animation, so the preference is set for every
     * context rather than remembered in each spec. Through `contextOptions`, which is where this
     * version puts it — the specs emulate it a second time, and the two agree.
     */
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'storybook',
      testMatch: ['**/blocks.spec.ts', '**/themes.spec.ts', '**/controls.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        baseURL: `http://127.0.0.1:${STORYBOOK_PORT}`,
        // After the spread, not before: `devices` carries a viewport of its own, and a fixed frame is
        // a determinism control — every shot came out 1280 × 720 until these two moved down here.
        viewport: FRAME,
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'studio',
      testMatch: ['**/studio-chrome.spec.ts', '**/export-dialog.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        baseURL: `http://localhost:${STUDIO_PORT}`,
        viewport: FRAME,
        deviceScaleFactor: 1,
      },
    },
  ],

  webServer: [
    {
      command: `node ../scripts/serve-storybook.mjs ${STORYBOOK_PORT}`,
      url: `http://127.0.0.1:${STORYBOOK_PORT}/iframe.html?id=thumbnail-block--preview`,
      reuseExistingServer: !CI,
      timeout: 60_000,
      cwd: '.',
    },
    {
      command: 'pnpm --filter web start',
      url: `http://localhost:${STUDIO_PORT}/studio`,
      reuseExistingServer: !CI,
      timeout: 120_000,
      cwd: '..',
    },
  ],
})
