import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { GOLDEN_DOCUMENTS } from '../src/test/documents'
import type { GoldenCase } from '../src/test/golden-cases'
import { printCase } from '../src/test/print-case'

/**
 * Writes one export to a directory on disk, so the claim "builds with zero edits" can be checked the
 * way a user would check it: `npm install && npm run build && npm run dev`.
 *
 * ```
 * pnpm generate:export-fixture --document full-landing --target next --out ../exported
 * ```
 *
 * It runs against the fixture catalogue rather than `packages/blocks`, because `codegen` may not import
 * that package and because the shipped catalogue has 53 entries with no declared client boundary — the
 * export refuses those by design (ADR-199), and prompt 42's report escalated it.
 */
const flags = new Map<string, string>()

for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index]
  const value = process.argv[index + 1]

  if (flag?.startsWith('--') === true && value !== undefined) {
    flags.set(flag.slice(2), value)
  }
}

const documentName = flags.get('document') ?? 'full-landing'
const target = flags.get('target') === 'react' ? 'react' : 'next'
const out = resolve(flags.get('out') ?? join(process.cwd(), 'exported'))
const make = GOLDEN_DOCUMENTS[documentName]

if (make === undefined) {
  const names = Object.keys(GOLDEN_DOCUMENTS).join(', ')

  throw new Error(`No document '${documentName}'. Available: ${names}`)
}

const goldenCase: GoldenCase = {
  id: `${documentName}/${target}`,
  document: documentName,
  options: { target },
}
const result = await printCase(goldenCase, make())

for (const file of result.files) {
  const path = join(out, file.path)

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, file.contents, 'utf8')
}

console.log(`${result.files.length} files → ${out}`)

for (const entry of result.warnings) {
  console.log(`  [${entry.code}] ${entry.message}`)
}
