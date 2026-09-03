import { join } from 'node:path'

import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

/**
 * Two switches, both off by default, so an ordinary `pnpm build` is byte-identical to what it was.
 * `ANALYZE=true` produces the treemap PERFORMANCE.md § Mandatory dynamic imports names as the proof.
 * `MS_INSTRUMENT=1` keeps the render counters and the store handle in a production build; declaring
 * it here is what makes the value inlined whether or not it is set (ADR-315).
 */
const config: NextConfig = {
  env: { MS_INSTRUMENT: process.env['MS_INSTRUMENT'] ?? '' },
  /*
   * The container's runtime — DEVOPS.md § Docker. Next traces what the server actually imports and
   * writes it, with a pruned `node_modules`, to `.next/standalone`; the image copies that instead of
   * a workspace install, which is the difference between a small image and one carrying pnpm's whole
   * store.
   *
   * **Behind a flag, and the flag is the Dockerfile's.** In a pnpm workspace the trace is written as
   * symlinks into the store, and Windows refuses to create one without Developer Mode or an elevated
   * shell — so an unconditional `standalone` fails `pnpm build` on a developer machine to serve a
   * build that only ever runs in Linux. The image sets `MS_STANDALONE=1`; nothing else does.
   */
  ...(process.env['MS_STANDALONE'] === '1'
    ? {
        output: 'standalone' as const,
        // The workspace root, not `apps/web`: the trace has to reach the packages the app imports.
        outputFileTracingRoot: join(import.meta.dirname, '..', '..'),
        /*
         * Three things the trace picks up that the server never executes, measured in the image:
         * 16 MB of sharp's glibc binaries (the image is Alpine, which uses the musl build beside
         * them), 8.5 MB of TypeScript, and 2.5 MB of `caniuse-lite`. Together they are a fifth of
         * the image, and none of them is reachable from a request — the healthcheck and the landing
         * page in `ci.yml` are what prove that rather than this comment.
         */
        outputFileTracingExcludes: {
          '**/*': [
            '**/@img/sharp-libvips-linux-x64/**',
            '**/@img/sharp-linux-x64/**',
            // Scoped to the package: `**/typescript/**` also matched `next/dist/lib/typescript`,
            // which the server loads on start — the container died with "Cannot find module
            // '../../lib/typescript/required-packages'".
            '**/node_modules/typescript/**',
            '**/caniuse-lite/**',
          ],
        },
      }
    : {}),
}

export default bundleAnalyzer({ enabled: process.env['ANALYZE'] === 'true' })(config)
