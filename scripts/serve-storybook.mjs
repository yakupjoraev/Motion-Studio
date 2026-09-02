#!/usr/bin/env node
/**
 * The built Storybook, on a port — the origin the visual suite screenshots against.
 *
 *   node scripts/serve-storybook.mjs [port]
 *
 * A CLI over `scripts/thumbnails/serve.mjs`, which the thumbnail generator already uses for the same
 * build: a Storybook built for `file://` cannot fetch its own index, so it needs an origin, and that
 * is the whole requirement. Playwright's `webServer` needs a command rather than a function, which is
 * the only reason this file exists beside that one.
 */
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { serveStatic } from './thumbnails/serve.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const STATIC = join(ROOT, 'apps', 'storybook', 'storybook-static')
const port = Number(process.argv[2] ?? 6007)

if (!existsSync(STATIC)) {
  console.error(`serve-storybook: no Storybook build at ${STATIC}. Run \`pnpm build:storybook\`.`)
  process.exit(1)
}

await serveStatic(STATIC, port)
console.log(`serve-storybook: ${STATIC} on http://127.0.0.1:${port}`)
