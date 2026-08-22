import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { serializeDocument } from '@motion-studio/schema'

import { GOLDEN_DOCUMENTS } from '../src/test/documents'
import { GOLDEN_CASES } from '../src/test/golden-cases'
import { printCase } from '../src/test/print-case'

/**
 * Writes `src/printers/__golden__/` — ADR-235. The documents are serialised from `src/test/documents.ts`
 * so there is one authoring source, and the expected output is printed by the same three calls the
 * golden test runs.
 *
 * Updating a golden file is therefore two steps: run this, then read the diff. The reading is the
 * review gate EXPORT_ENGINE.md § Testing asks for — "that is the mechanism that keeps the output from
 * slowly degrading" — and automating it away would remove the only thing checking output quality.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'printers', '__golden__')

const write = (path: string, contents: string): void => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents, 'utf8')
}

rmSync(join(ROOT, 'documents'), { recursive: true, force: true })
rmSync(join(ROOT, 'expected'), { recursive: true, force: true })

for (const [name, make] of Object.entries(GOLDEN_DOCUMENTS)) {
  write(join(ROOT, 'documents', `${name}.motion.json`), `${serializeDocument(make())}\n`)
}

let count = 0

for (const goldenCase of GOLDEN_CASES) {
  const make = GOLDEN_DOCUMENTS[goldenCase.document]

  if (make === undefined) {
    throw new Error(`No golden document '${goldenCase.document}' for case '${goldenCase.id}'`)
  }

  const result = await printCase(goldenCase, make())

  for (const file of result.files) {
    write(join(ROOT, 'expected', goldenCase.id, file.path), file.contents)
    count += 1
  }

  // Beside the project directory, never inside it: the export is what a user downloads, and a report
  // file in the tree would be the first thing they had to delete.
  const report = {
    dependencies: result.dependencies,
    warnings: result.warnings.map((entry) => ({
      code: entry.code,
      message: entry.message,
      ...(entry.nodeId === undefined ? {} : { nodeId: entry.nodeId }),
    })),
  }

  write(
    join(ROOT, 'expected', `${goldenCase.id}.report.json`),
    `${JSON.stringify(report, null, 2)}\n`,
  )
}

console.log(
  `${GOLDEN_CASES.length} cases, ${count} files, ${Object.keys(GOLDEN_DOCUMENTS).length} documents`,
)
