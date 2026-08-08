import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@motion-studio/config/vitest/react'

// No coverage floor: TESTING.md § Coverage contract lists ten packages and `web` is not one of
// them. The shell's behaviour is covered by its own tests; the routes are covered by Playwright.
//
// `jsx: automatic` is stated here rather than inherited: the app's tsconfig sets `jsx: preserve`
// because Next compiles JSX with its own pipeline, and esbuild reads that and hands the JSX to a
// classic runtime that has no `React` in scope. The packages do not need it — they compile with
// `react-jsx` already.
export default mergeConfig(reactConfig, defineConfig({ esbuild: { jsx: 'automatic' } }))
