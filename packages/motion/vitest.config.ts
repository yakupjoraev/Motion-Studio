import { defineConfig, mergeConfig } from 'vitest/config'

import { reactConfig } from '@motion-studio/config/vitest/react'

// TESTING.md § Coverage contract: 85 % lines / 80 % branches — preset resolution,
// reduced-motion mapping.
export default mergeConfig(
  reactConfig,
  defineConfig({ test: { coverage: { thresholds: { lines: 85, branches: 80 } } } }),
)
