#!/usr/bin/env node
/**
 * Regenerates the visual baselines — and refuses to do it anywhere but CI.
 *
 *   # never this, on a laptop:
 *   #   pnpm test:visual -u
 *   # this, through the labelled workflow job:
 *   node scripts/update-baselines.mjs
 *
 * **Why the refusal.** A baseline is a rasterised screenshot, and rasterisation follows the machine:
 * font hinting, subpixel positioning and the installed font files all differ between a Windows
 * desktop, a macOS laptop and the Linux container CI runs. A baseline generated on any one of them
 * fails on the other two, so the first contributor to regenerate locally would commit a set that only
 * matches their own machine — and the next person would "fix" it by regenerating on theirs.
 *
 * One platform generates them, and it is the one that checks them: `linux-chromium`, in the container
 * the test job uses. That is not a preference, it is the only arrangement in which a committed
 * baseline means anything.
 */
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const CI = process.env['CI'] === 'true' || process.env['CI'] === '1'
const forced = process.argv.includes('--i-know-this-is-not-ci')

if (!CI && !forced) {
  console.error(
    [
      'update-baselines: refusing to run outside CI.',
      '',
      'Baselines are rasterised screenshots, so they follow the machine that took them — fonts,',
      'hinting and subpixel positioning all differ. A set generated here would fail on every other',
      'machine, including the one that gates pull requests.',
      '',
      'Run the `visual` workflow instead: push a branch and add the `visual` label, or dispatch it',
      'from the Actions tab with `update-baselines` set. It regenerates in the same container the',
      'test job uses and commits the result.',
      '',
      'See CONTRIBUTING.md § Visual baselines.',
    ].join('\n'),
  )
  process.exit(1)
}

const run = (command, args, cwd = ROOT) => {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: true })

  if (result.status !== 0) {
    console.error(`update-baselines: \`${command} ${args.join(' ')}\` exited ${result.status}`)
    process.exit(result.status ?? 1)
  }
}

// The suite needs both origins built: the Storybook it screenshots blocks from, and the studio it
// screenshots chrome from.
run('pnpm', ['build:storybook'])
run('pnpm', ['build'])
run(
  'pnpm',
  ['exec', 'playwright', 'test', '-c', 'visual.config.ts', '--update-snapshots'],
  join(ROOT, 'e2e'),
)

console.log(
  'update-baselines: done. Review the diff before committing — a baseline captures bugs too.',
)
