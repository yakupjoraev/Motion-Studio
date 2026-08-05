import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@motion-studio/config/vitest/react'

// TESTING.md § Coverage contract: 70 % lines / 60 % branches — Radix-backed; test our
// behaviour, not theirs.
export default mergeConfig(
  reactConfig,
  defineConfig({ test: { coverage: { thresholds: { lines: 70, branches: 60 } } } }),
)
