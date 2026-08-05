import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@motion-studio/config/vitest/react'

// TESTING.md § Coverage contract: 80 % lines / 75 % branches — the pure resolver; the rest is E2E.
export default mergeConfig(
  reactConfig,
  defineConfig({ test: { coverage: { thresholds: { lines: 80, branches: 75 } } } }),
)
