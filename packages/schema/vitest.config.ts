import { defineConfig, mergeConfig } from 'vitest/config'

import { nodeConfig } from '@motion-studio/config/vitest/node'

// TESTING.md § Coverage contract: 90 % lines / 85 % branches. Validation and migrations — a bug
// here corrupts files.
export default mergeConfig(
  nodeConfig,
  defineConfig({ test: { coverage: { thresholds: { lines: 90, branches: 85 } } } }),
)
