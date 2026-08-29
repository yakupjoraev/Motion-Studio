#!/usr/bin/env node
/**
 * `pnpm test:compile` — EXPORT_ENGINE.md § Testing, Compilation tests: "For every golden React and Next
 * output, run `tsc --noEmit` against it in a fixture project with the declared dependencies installed.
 * A generated file that does not type-check fails CI. This is the test that makes 'compiles with zero
 * edits' a fact rather than an aspiration."
 *
 * Two kinds of project are checked, and the second is the one that finds bugs (ADR-254):
 *
 * 1. **The goldens**, which the export engine's own fixture catalogue produced.
 * 2. **The shipped catalogue**, exported here and now from the committed fixture documents. `codegen`
 *    may not import `packages/blocks`, so no golden can carry the real markup; this is where the 72
 *    catalogue entries meet `tsc`.
 *
 * Each project is copied into `<fixture>/.compile/`, which is scratch and gitignored — ADR-235. `tsc`
 * and Next both write into a project they inspect (`next-env.d.ts`, `*.tsbuildinfo`), and a golden tree
 * with build output in it would fail its own file-list assertion.
 *
 * A Next project is checked against **its own emitted `tsconfig.json`**, which is what makes the claim
 * about the emitted config real. A React export is not a project — the user pastes it into theirs — so
 * `e2e/fixtures/compile/react/tsconfig.json` is the host, and that file is the only thing added.
 */
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const EXPECTED = join(ROOT, 'packages', 'codegen', 'src', 'printers', '__golden__', 'expected')
const FIXTURES = join(ROOT, 'e2e', 'fixtures', 'compile')

/** The committed documents exported from the shipped catalogue, and the targets that emit TypeScript. */
const CATALOGUE_CASES = [
  { document: 'export-landing', target: 'react' },
  { document: 'export-landing', target: 'next' },
  { document: 'coverage-catalogue', target: 'react' },
  { document: 'coverage-catalogue', target: 'next' },
]

/** What `next build` writes on its first run. Producing it is not editing the export. */
const NEXT_ENV = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))

function goldenProjects() {
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

/** The shipped catalogue, exported into the scratch tree the same way a user would export it. */
function catalogueProjects() {
  return CATALOGUE_CASES.map((entry) => {
    const name = `catalogue__${entry.document}__${entry.target}`
    const out = join(FIXTURES, entry.target === 'next' ? 'next' : 'react', '.compile', name)

    mkdirSync(out, { recursive: true })

    // `tsx` is invoked through node rather than through a shell: a path with a space in it is a
    // different argument list on Windows, and this repository has one.
    const run = spawnSync(
      process.execPath,
      [
        join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
        join(ROOT, 'scripts', 'generate-export-fixture.ts'),
        '--document',
        entry.document,
        '--target',
        entry.target,
        '--out',
        out,
      ],
      { cwd: ROOT, encoding: 'utf8' },
    )

    if (run.status !== 0) {
      throw new Error(
        `Export of ${entry.document}/${entry.target} failed:\n${run.stdout}${run.stderr}`,
      )
    }

    return { id: `catalogue/${entry.document}/${entry.target}`, name, source: out, generated: true }
  })
}

const hasTypeScript = (directory) =>
  readdirSync(directory, { withFileTypes: true, recursive: true }).some(
    (entry) => entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name),
  )

/**
 * The claim `package.json` makes has to be true of the host: a dependency the export declares and the
 * fixture has not installed would be checked against no types at all, and `tsc` would pass on nothing.
 */
function checkDeclaredDependencies(project, target) {
  const manifestPath = join(project, 'package.json')

  if (!existsSync(manifestPath)) {
    return []
  }

  const installed = read(join(FIXTURES, target, 'package.json'))
  const available = { ...installed.dependencies, ...installed.devDependencies }

  return Object.keys(read(manifestPath).dependencies ?? {})
    .filter((name) => available[name] === undefined)
    .map(
      (name) =>
        `${name} is declared by the export and not installed in e2e/fixtures/compile/${target}`,
    )
}

for (const target of ['react', 'next']) {
  rmSync(join(FIXTURES, target, '.compile'), { recursive: true, force: true })
  mkdirSync(join(FIXTURES, target, '.compile'), { recursive: true })
}

const failures = []
const skipped = []
const projects = [...goldenProjects(), ...catalogueProjects()]

for (const project of projects) {
  if (!hasTypeScript(project.source)) {
    skipped.push(project.id)
    console.log(`  skip ${project.id}  (no TypeScript to check)`)
    continue
  }

  const isNext = existsSync(join(project.source, 'tsconfig.json'))
  const target = isNext ? 'next' : 'react'
  const fixture = join(FIXTURES, target)
  const directory = join(fixture, '.compile', project.name)

  if (project.generated !== true) {
    cpSync(project.source, directory, { recursive: true })
  }

  if (isNext) {
    writeFileSync(join(directory, 'next-env.d.ts'), NEXT_ENV, 'utf8')
  } else {
    cpSync(join(fixture, 'tsconfig.json'), join(directory, 'tsconfig.json'))
  }

  const undeclared = checkDeclaredDependencies(directory, target)

  if (undeclared.length > 0) {
    failures.push(project.id)
    console.error(`  FAIL ${project.id}\n    ${undeclared.join('\n    ')}`)
    continue
  }

  const run = spawnSync(
    process.execPath,
    [join(fixture, 'node_modules', 'typescript', 'lib', 'tsc.js'), '--noEmit', '-p', directory],
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

const checked = projects.length - skipped.length

console.log(
  `\n${checked - failures.length}/${checked} projects type-check, ${skipped.length} skipped`,
)

if (failures.length > 0) {
  console.error(`\nFailed: ${failures.join(', ')}`)
  process.exit(1)
}
