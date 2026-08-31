#!/usr/bin/env node
/**
 * What a route downloads before it can do anything, as a module graph rather than as a chunk list.
 *
 * `measure-routes.mjs` says how many bytes; this says which files put them there. It walks **static**
 * imports only from an entry, stopping at every `import()` — a dynamic boundary is a chunk the route
 * does not wait for — and reports the files that reach a given module.
 *
 *   node scripts/eager-graph.mjs apps/web/app/studio/studio-client.tsx @motion-studio/blocks
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const [entryArg, target] = process.argv.slice(2)

if (entryArg === undefined || target === undefined) {
  process.stderr.write('usage: eager-graph.mjs <entry file> <module specifier prefix>\n')
  process.exit(1)
}

const WORKSPACE = {
  '@motion-studio/blocks': 'packages/blocks/src',
  '@motion-studio/canvas': 'packages/canvas/src',
  '@motion-studio/dnd': 'packages/dnd/src',
  '@motion-studio/editor': 'packages/editor/src',
  '@motion-studio/hooks': 'packages/hooks/src',
  '@motion-studio/icons': 'packages/icons/src',
  '@motion-studio/motion': 'packages/motion/src',
  '@motion-studio/schema': 'packages/schema/src',
  '@motion-studio/theme': 'packages/theme/src',
  '@motion-studio/tokens': 'packages/tokens/src',
  '@motion-studio/ui': 'packages/ui/src',
  '@motion-studio/utils': 'packages/utils/src',
}

/**
 * `import x from 'y'` and `export … from 'y'`, but never `import('y')` and never `import type` —
 * `verbatimModuleSyntax` erases a type-only import, so counting one blames a file for bytes it does
 * not carry. That mistake is easy to make: `control-renderer/coerce.ts` names eight field modules
 * and imports nothing from any of them.
 */
const STATIC_IMPORT =
  /(?:^|\n)\s*(?:import|export)(?![\s(]*\()(?!\s+type\s)[^;'"]*?from\s*['"]([^'"]+)['"]/g
const SIDE_EFFECT_IMPORT = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g

const resolveSpecifier = (specifier, from) => {
  if (specifier.startsWith('.')) {
    const base = resolve(dirname(from), specifier)

    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      join(base, 'index.ts'),
      join(base, 'index.tsx'),
    ]) {
      if (existsSync(candidate) && !candidate.endsWith('/')) {
        return candidate
      }
    }

    return null
  }

  for (const [name, dir] of Object.entries(WORKSPACE)) {
    if (specifier === name) {
      return join(ROOT, dir, 'index.ts')
    }

    if (specifier.startsWith(`${name}/`)) {
      const rest = specifier.slice(name.length + 1)

      for (const candidate of [
        join(ROOT, dir, `${rest}.ts`),
        join(ROOT, dir, `${rest}.tsx`),
        join(ROOT, dir, rest, 'index.ts'),
      ]) {
        if (existsSync(candidate)) {
          return candidate
        }
      }
    }
  }

  return null
}

const entry = resolve(ROOT, entryArg)
const seen = new Set()
const parents = new Map()
const importers = []

const walk = (file) => {
  if (seen.has(file)) {
    return
  }

  seen.add(file)

  const source = readFileSync(file, 'utf8')
  const specifiers = new Set()

  for (const pattern of [STATIC_IMPORT, SIDE_EFFECT_IMPORT]) {
    pattern.lastIndex = 0

    for (const match of source.matchAll(pattern)) {
      specifiers.add(match[1])
    }
  }

  for (const specifier of specifiers) {
    if (specifier.startsWith(target)) {
      importers.push({ file, specifier })
    }

    const next = resolveSpecifier(specifier, file)

    if (next !== null && !seen.has(next)) {
      parents.set(next, file)
      walk(next)
    }
  }
}

walk(entry)

const relative = (file) => file.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '').replace(/\\/g, '/')

process.stdout.write(`${seen.size} files load eagerly from ${entryArg}\n`)
process.stdout.write(`\n${importers.length} of them import ${target}:\n`)

for (const { file, specifier } of importers) {
  const chain = []
  let current = file

  while (current !== undefined && current !== entry) {
    chain.push(relative(current))
    current = parents.get(current)
  }

  process.stdout.write(`  ${specifier}\n      ${chain.reverse().join('\n    → ')}\n`)
}
