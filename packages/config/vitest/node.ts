import { type ViteUserConfig, defineConfig } from 'vitest/config'

/**
 * Kept out of the coverage denominator: the tests themselves, the barrels (re-exports have no
 * branches to cover, so counting them only inflates the number), the type-only modules, the shared
 * factories from CODE_STANDARDS.md § Testing style, and the Storybook stories.
 *
 * Stories are executed by Storybook, never by Vitest. Counting them measures how much of Storybook the
 * unit tests happen to run, which is not a question anyone asked — and it drags a well-tested package
 * under its floor for writing more documentation.
 *
 * `*.types.ts` holds interfaces and type aliases, which TypeScript erases. There is no statement in the
 * emitted module for a test to reach, so every line of it counts as uncovered forever — ADR-034 measured
 * what that costs. Barrels are `src/**` rather than only the package root because the six-file component
 * layout puts one in every component directory, and they are the same re-exports for the same reason.
 */
export const coverageExclude = [
  'src/**/*.test.{ts,tsx}',
  'src/**/*.stories.tsx',
  'src/**/*.types.ts',
  'src/**/index.ts',
  'src/test/**',
]

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
