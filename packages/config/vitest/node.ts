import { type ViteUserConfig, defineConfig } from 'vitest/config'

/**
 * Kept out of the coverage denominator: the tests themselves, the barrel (re-exports have no
 * branches to cover, so counting them only inflates the number), and the shared factories from
 * CODE_STANDARDS.md § Testing style.
 */
export const coverageExclude = ['src/**/*.test.{ts,tsx}', 'src/index.ts', 'src/test/**']

/**
 * Preset for the React-free packages. Coverage thresholds are deliberately absent — TESTING.md
 * § Coverage contract sets a floor per package, and a shared number here would let a well-tested
 * package cover for an untested one.
 */
export const nodeConfig: ViteUserConfig = defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // lcov is what the codecov step in DEVOPS.md § CI uploads.
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: coverageExclude,
    },
  },
})
