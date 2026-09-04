/**
 * Lighthouse CI — the budgets in `docs/PERFORMANCE.md` § Public pages, asserted rather than recorded.
 * One file, two presets, three runs per URL with the median taken. `.cjs` because the root is
 * `"type": "module"` and Lighthouse CI loads its config with `require`.
 */
// Not `LHCI_PRESET`: Lighthouse CI maps every `LHCI_*` variable onto an option of its own, and
// `--preset` there means the assertion preset — `lhci assert` rejects "mobile" as a value for it.
const desktop = process.env.MS_LH_PRESET === 'desktop'

/** `next start` reads `PORT`, so one variable moves the server and the URLs together. */
const port = process.env.PORT ?? '3000'
const origin = `http://localhost:${port}`

/**
 * `deploy.yml` § report measures a deployment that is already serving, so that leg starts no server
 * and asserts nothing — its numbers go in the pull request's comment. Set as a variable rather than
 * passed as `--url`, because a flag does not stop this file from starting a server it has no build
 * for, which is how the job failed the first time it ran.
 */
const previewUrl = process.env.MS_LH_URL

/** The four public routes. `/studio` is held to its budgets by `size-limit` and `e2e/perf` instead. */
const routes = ['/', '/blocks', '/blocks/section', '/docs']

/** PERFORMANCE.md § Public pages. The score budgets are the same on both presets. */
const scores = {
  'categories:performance': ['error', { minScore: 0.95 }],
  'categories:accessibility': ['error', { minScore: 0.95 }],
  'categories:best-practices': ['error', { minScore: 0.95 }],
  'categories:seo': ['error', { minScore: 0.95 }],
}

/** LCP is the one budget that is about the hardware; desktop gets the mobile figure halved. */
const timings = {
  'largest-contentful-paint': ['error', { maxNumericValue: desktop ? 1000 : 2000 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.02 }],
  'total-blocking-time': ['error', { maxNumericValue: 200 }],
}

// `devtools` — the browser is throttled for real rather than a fast run being extrapolated.
// ADR-319 has the measurement that made the difference load-bearing.
const settings = desktop
  ? { preset: 'desktop', throttlingMethod: 'devtools' }
  : { throttlingMethod: 'devtools' }

const collect = previewUrl
  ? { url: [previewUrl], numberOfRuns: 1, settings }
  : {
      startServerCommand: 'pnpm --filter web start',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 120000,
      url: routes.map((route) => `${origin}${route}`),
      numberOfRuns: 3,
      settings,
    }

module.exports = {
  ci: {
    collect,
    // No `preset`: these seven are the rows of PERFORMANCE.md § Public pages, and nothing else.
    assert: { assertions: { ...scores, ...timings } },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
}
