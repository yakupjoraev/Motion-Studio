import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * A production build with the counters and the store handle left in — `pnpm build` plus
 * `MS_INSTRUMENT=1`, which the zero-re-render specs need on top of production React (ADR-315).
 * A file rather than a shell prefix because `VAR=1 cmd` is not portable.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const result = spawnSync('pnpm', ['--filter', 'web', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, MS_INSTRUMENT: '1' },
})

process.exit(result.status ?? 1)
