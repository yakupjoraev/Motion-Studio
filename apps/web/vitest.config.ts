import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@motion-studio/config/vitest/react'

// No coverage floor: TESTING.md § Coverage contract lists ten packages and `web` is not one of
// them. The shell's behaviour is covered by its own tests; the routes are covered by Playwright.
//
// `jsx: automatic` is stated here rather than inherited: the app's tsconfig sets `jsx: preserve`
// because Next compiles JSX with its own pipeline, and esbuild reads that and hands the JSX to a
// classic runtime that has no `React` in scope. The packages do not need it — they compile with
// `react-jsx` already.
//
// The setup list is written out rather than appended to: `mergeConfig` replaces the array, and the
// shared React setup has to keep running beside this app's own.
//
// `app/**` joins the include for the route error boundaries only. They are the exception to "the
// routes are covered by Playwright": `global-error.tsx` renders when the root layout threw, and the
// only way to reach it in a browser is to break the layout on purpose, in a build, for one spec.
export default mergeConfig(
  reactConfig,
  defineConfig({
    esbuild: { jsx: 'automatic' },
    test: {
      include: ['src/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}'],
      setupFiles: ['@motion-studio/config/vitest/setup-react', './src/test/setup.ts'],
    },
  }),
)
