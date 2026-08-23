#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
/**
 * `test:compile` — EXPORT_ENGINE.md § Testing, Compilation tests: "For every golden React and Next
 * output, run `tsc --noEmit` against it in a fixture project with the declared dependencies installed.
 * A generated file that does not type-check fails CI. This is the test that makes 'compiles with zero
 * edits' a fact rather than an aspiration."
 *
 * Every project is copied byte for byte into `.compile/`, which is scratch and gitignored — ADR-235.
 * `tsc` and Next both write into a project they inspect (`next-env.d.ts`, `*.tsbuildinfo`), and a golden
 * tree with build output in it would fail its own file-list assertion.
 *
 * A Next project is checked against **its own emitted `tsconfig.json`**, which is what makes the claim
 * about the emitted config real. A React export is not a project — the user pastes it into theirs — so
 * the harness supplies `react-tsconfig.json` as the host, and that file is the only thing added.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXPECTED = join(PACKAGE, 'src', 'printers', '__golden__', 'expected')
const SCRATCH = join(PACKAGE, '.compile')

/** What `next build` writes on its first run. Producing it is not editing the export. */
const NEXT_ENV = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`

function projects() {
  if (!existsSync(EXPECTED)) {
    throw new Error(`No golden output at ${EXPECTED}. Run \`pnpm golden:update\` first.`)
  }

  return readdirSync(EXPECTED, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((document) =>
      readdirSync(join(EXPECTED, document.name), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
          id: `${document.name}/${entry.name}`,
          name: `${document.name}__${entry.name}`,
          source: join(EXPECTED, document.name, entry.name),
        })),
    )
}

rmSync(SCRATCH, { recursive: true, force: true })
mkdirSync(SCRATCH, { recursive: true })

const failures = []
const skipped = []
const list = projects()

/**
 * The HTML and JSON targets emit no TypeScript, so there is nothing for `tsc` to check and pointing it
 * at one is a false red rather than a finding — it fails with TS18003, "no inputs were found". They are
 * reported as skipped, which is the truth, and their own goldens are what locks their output.
 */
const hasTypeScript = (directory) =>
  readdirSync(directory, { withFileTypes: true, recursive: true }).some(
    (entry) => entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name),
  )

for (const project of list) {
  const target = join(SCRATCH, project.name)

  cpSync(project.source, target, { recursive: true })

  if (!hasTypeScript(target)) {
    skipped.push(project.id)
    console.log(`  skip ${project.id}  (no TypeScript to check)`)
    continue
  }

  const isNext = existsSync(join(target, 'tsconfig.json'))

  if (isNext) {
    writeFileSync(join(target, 'next-env.d.ts'), NEXT_ENV, 'utf8')
  } else {
    cpSync(join(PACKAGE, 'scripts', 'react-tsconfig.json'), join(target, 'tsconfig.json'))
  }

  const run = spawnSync(
    process.execPath,
    [join(PACKAGE, 'node_modules', 'typescript', 'lib', 'tsc.js'), '--noEmit', '-p', target],
    { encoding: 'utf8' },
  )

  if (run.status === 0) {
    console.log(`  ok   ${project.id}${isNext ? '' : '  (host tsconfig)'}`)
    continue
  }

  failures.push(project.id)
  console.error(`  FAIL ${project.id}`)
  console.error(`${run.stdout ?? ''}${run.stderr ?? ''}`.trimEnd())
}

console.log(
  `
${list.length - failures.length - skipped.length}/${list.length - skipped.length} golden projects type-check, ${skipped.length} skipped`,
)

if (failures.length > 0) {
  console.error(`\nFailed: ${failures.join(', ')}`)
  process.exit(1)
}
