import { type ViteUserConfig, defineConfig } from 'vitest/config'

// Self-referenced through this package's own `exports` map rather than as `./node`: the consumer's
// Vitest treats a bare specifier as external and hands the file to Node's ESM loader, which will
// not resolve an extensionless relative path.
import { coverageExclude } from '@motion-studio/config/vitest/node'

/**
 * Preset for the packages that render React. `include` covers `.test.ts` as well as `.test.tsx`,
 * so a package on this preset still runs its pure tests — the reverse is not true, which is why a
 * package that will ever hold a component test belongs here rather than on the node preset.
 *
 * The setup file is referenced by package specifier rather than by path: it is resolved through
 * this package's `exports` map, so the consumer's config never encodes where it lives on disk.
 */
export const reactConfig: ViteUserConfig = defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['@motion-studio/config/vitest/setup-react'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: coverageExclude,
    },
  },
})
