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
}

export default bundleAnalyzer({ enabled: process.env['ANALYZE'] === 'true' })(config)
