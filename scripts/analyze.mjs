#!/usr/bin/env node
/**
 * `pnpm analyze` — PERFORMANCE.md § Mandatory dynamic imports: "the treemap that proves it".
 *
 * A script rather than an inline `ANALYZE=true next build`, because the two shells this repository is
 * built on disagree about how to set an environment variable for one command, and a build gate that
 * works on one machine is not a gate.
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'web')

const result = spawnSync('npx', ['next', 'build'], {
  cwd: WEB,
  env: { ...process.env, ANALYZE: 'true' },
  stdio: 'inherit',
  shell: true,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log(`\nTreemaps: ${join(WEB, '.next', 'analyze')}`)
