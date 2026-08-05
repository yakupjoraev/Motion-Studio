import { defineConfig, mergeConfig } from 'vitest/config'

import { nodeConfig } from '@motion-studio/config/vitest/node'

// TESTING.md § Coverage contract: 95 % lines / 90 % branches — trivially testable, so no excuse.
export default mergeConfig(
  nodeConfig,
  defineConfig({ test: { coverage: { thresholds: { lines: 95, branches: 90 } } } }),
)
