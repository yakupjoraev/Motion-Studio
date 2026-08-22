import { defineConfig, mergeConfig } from 'vitest/config'

import { nodeConfig } from '@motion-studio/config/vitest/node'

// TESTING.md § Coverage contract: 85 % lines / 80 % branches — output quality is the
// product's credibility.
//
// The golden tree is printed output, not source. Counting it would measure how much of a generated
// project the unit tests import, which is not a question anyone asked, and its `lib/*.ts` modules are
// files this package wrote rather than files it runs.
export default mergeConfig(
  nodeConfig,
  defineConfig({
    test: {
      coverage: {
        thresholds: { lines: 85, branches: 80 },
        exclude: ['src/printers/__golden__/**'],
      },
    },
  }),
)
