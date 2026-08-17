import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@motion-studio/config/vitest/react'

// TESTING.md § Coverage contract: 70 % lines / 60 % branches — Radix-backed, so the tests cover our
// behaviour rather than theirs.
//
// The setup list is written out rather than appended to: `mergeConfig` replaces the array, and the
// shared React setup has to keep running beside this package's own.
export default mergeConfig(
  reactConfig,
  defineConfig({
    test: {
      coverage: { thresholds: { lines: 70, branches: 60 } },
      setupFiles: ['@motion-studio/config/vitest/setup-react', './src/test/setup.ts'],
    },
  }),
)
