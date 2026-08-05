import { defineConfig, mergeConfig } from 'vitest/config'

import { nodeConfig } from '@motion-studio/config/vitest/node'

// TESTING.md § Coverage contract: 85 % lines / 80 % branches — output quality is the
// product's credibility.
export default mergeConfig(
  nodeConfig,
  defineConfig({ test: { coverage: { thresholds: { lines: 85, branches: 80 } } } }),
)
