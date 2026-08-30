#!/usr/bin/env tsx
/**
 * Writes the eight starter templates into `apps/web/public/templates/`, plus the manifest the picker
 * reads — FILE_FORMAT.md § Templates.
 *
 * The output is committed. This script is how it is regenerated when a block's defaults change, and
 * `pnpm check:registry` is what fails the build if a committed template stops parsing.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { blockRegistry } from '@motion-studio/blocks/registry'
import { nodeIds, serializeDocument, validateDocument } from '@motion-studio/schema'

import { TEMPLATES } from './templates/definitions'

const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'apps',
  'web',
  'public',
  'templates',
)

export interface TemplateManifestEntry {
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly nodeCount: number
  /** The block ids, top level first: what the picker draws its schematic preview from — ADR-288. */
  readonly outline: readonly string[]
}

export const MANIFEST_NAME = 'templates.json'

mkdirSync(OUT_DIR, { recursive: true })

const manifest: TemplateManifestEntry[] = []

for (const template of TEMPLATES) {
  const document = template.build()
  const validation = validateDocument(document, { registry: blockRegistry })

  if (!validation.ok) {
    const problems = validation.error.map((error) => `  ${error.code}: ${error.message}`).join('\n')

    throw new Error(`${template.slug} is not a valid document:\n${problems}`)
  }

  writeFileSync(join(OUT_DIR, `${template.slug}.motion.json`), `${serializeDocument(document)}\n`)

  const root = document.nodes[document.rootId]

  manifest.push({
    slug: template.slug,
    name: template.name,
    description: template.description,
    nodeCount: nodeIds(document).length,
    outline: (root?.children ?? []).map((id) => document.nodes[id]?.blockId ?? 'unknown'),
  })
}

writeFileSync(join(OUT_DIR, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`Wrote ${manifest.length} templates to ${OUT_DIR}`)
