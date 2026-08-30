import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

/**
 * The app ran without a config until now, and this one adds exactly one thing: the treemap
 * PERFORMANCE.md § Mandatory dynamic imports already names as the proof — "`pnpm analyze` produces
 * the treemap that proves it". The document prescribed the tool; this is the tool.
 *
 * It is off unless `ANALYZE=true`, so an ordinary `pnpm build` is byte-identical to what it was.
 */
const config: NextConfig = {}

export default bundleAnalyzer({ enabled: process.env['ANALYZE'] === 'true' })(config)
