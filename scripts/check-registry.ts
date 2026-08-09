#!/usr/bin/env tsx
/**
 * The registry gate — CI's `pnpm check:registry`.
 *
 * It answers one question the unit tests cannot: **does every block in the registry have a current
 * thumbnail, and does every thumbnail belong to a block?** The blocks package cannot ask it, because
 * the answer lives in `apps/web/public` and ARCHITECTURE.md § Dependency graph forbids a package
 * reaching into an app. A root script sees both sides, which is exactly why this one exists.
 *
 * It is a *presence and consistency* check, not a freshness one. Proving a thumbnail still matches
 * what its block renders would mean rendering it, which needs a browser — so that stays in
 * `pnpm generate:thumbnails`, and this is what CI can run in two seconds with nothing installed.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * The React-free half of the package (ADR-107). Importing the barrel would pull every block
 * component — and every icon — into a script whose whole job is to read metadata, which is precisely
 * the split that export exists for.
 */
import { DEFINITIONS } from '@motion-studio/blocks/registry'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const THUMBNAILS = join(ROOT, 'apps', 'web', 'public', 'thumbnails')
const MANIFEST = join(THUMBNAILS, 'thumbnails.json')

const MODES = ['dark', 'light'] as const
const EXPECTED = { width: 320, height: 200 }
/** FILE_FORMAT.md § Security caps a blur placeholder at 4 kB; ours are two orders under it. */
const MAX_BLUR_BYTES = 4 * 1024

interface ThumbnailEntry {
  readonly src?: unknown
  readonly width?: unknown
  readonly height?: unknown
  readonly blurDataUrl?: unknown
}

const problems: string[] = []

const complain = (message: string): void => {
  problems.push(message)
}

// Definition/component parity is asserted where it can be: `registry.meta.test.ts` in the package
// itself, which sees both maps. This script is about the half that lives outside any package.
/** A manifest that will not parse is a broken build, and it should read as one rather than as a stack. */
const readManifest = (): Record<string, Record<string, ThumbnailEntry>> | null => {
  try {
    const parsed: unknown = JSON.parse(readFileSync(MANIFEST, 'utf8'))

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      complain('The manifest is not an object of blocks. Run `pnpm generate:thumbnails`.')

      return null
    }

    return parsed as Record<string, Record<string, ThumbnailEntry>>
  } catch (error) {
    complain(`The manifest is not readable JSON: ${error instanceof Error ? error.message : ''}`)

    return null
  }
}

const manifest = existsSync(MANIFEST) ? readManifest() : null

if (!existsSync(MANIFEST)) {
  complain(`No manifest at ${MANIFEST}. Run \`pnpm generate:thumbnails\`.`)
} else if (manifest !== null) {
  const ids = DEFINITIONS.map((definition) => definition.id)

  for (const id of ids) {
    const block = manifest[id]

    if (block === undefined) {
      complain(`${id}: no manifest entry. Run \`pnpm generate:thumbnails --block ${id}\`.`)

      continue
    }

    for (const mode of MODES) {
      const entry = block[mode]
      const file = join(THUMBNAILS, `${id}-${mode}.webp`)

      if (entry === undefined) {
        complain(`${id}: the manifest has no ${mode} entry.`)

        continue
      }

      if (!existsSync(file)) {
        complain(`${id}: the manifest names a ${mode} thumbnail that is not on disk.`)
      }

      if (entry.width !== EXPECTED.width || entry.height !== EXPECTED.height) {
        complain(
          `${id} (${mode}): PERFORMANCE.md § Images wants ${EXPECTED.width} × ${EXPECTED.height}, ` +
            `the manifest says ${String(entry.width)} × ${String(entry.height)}.`,
        )
      }

      if (typeof entry.blurDataUrl !== 'string' || !entry.blurDataUrl.startsWith('data:image/')) {
        complain(`${id} (${mode}): the blur placeholder is not an image data URL.`)
      } else if (entry.blurDataUrl.length > MAX_BLUR_BYTES) {
        complain(`${id} (${mode}): the blur placeholder is over ${MAX_BLUR_BYTES} bytes.`)
      }
    }
  }

  // A thumbnail for a block that no longer exists is worse than a missing one: it never fails, and
  // the palette shows a picture of something a user cannot place.
  for (const id of Object.keys(manifest)) {
    if (!ids.includes(id as (typeof ids)[number])) {
      complain(`${id}: the manifest has an entry for a block the registry does not know.`)
    }
  }
}

if (problems.length > 0) {
  console.error('check-registry: failed')

  for (const problem of problems) {
    console.error(`  ${problem}`)
  }

  process.exit(1)
}

console.log(`check-registry: ${DEFINITIONS.length} blocks, ${MODES.length} thumbnails each — ok`)
