#!/usr/bin/env node
/**
 * The dependency graph gate: four assertions specified in `docs/DEVOPS.md` § Custom gates, enforcing
 * the rules in `docs/ARCHITECTURE.md` § Dependency graph. Node built-ins only, so it runs before
 * install in a fork's CI.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** § Rules, as data. Consumer first, forbidden dependency second. */
const FORBIDDEN = [
  ['@motion-studio/editor', '@motion-studio/blocks'],
  ['@motion-studio/blocks', '@motion-studio/editor'],
  ['@motion-studio/canvas', '@motion-studio/editor'],
  ['@motion-studio/canvas', '@motion-studio/blocks'],
  ['@motion-studio/codegen', '@motion-studio/blocks'],
]

const EXTENSIONS = ['.ts', '.tsx', '.mts', '.mjs', '.js', '.json']
const SKIP = new Set(['node_modules', '.next', '.turbo', 'dist', 'coverage', 'build'])
const INTERNAL = /['"](@motion-studio\/[^'"]*)['"]/g
const SCOPE = '@motion-studio/'
const failures = []
const fail = (message) => failures.push(message)
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const at = (file, index) => `${relative(ROOT, file)}:${index + 1}`

/** Directories from pnpm-workspace.yaml's `packages:` list, so a new root cannot escape the gate. */
function packageDirectories() {
  const lines = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8').split('\n')
  const globs = []
  for (const line of lines.slice(lines.findIndex((l) => l.trim() === 'packages:') + 1)) {
    const entry = /^\s*-\s*['"]?([^'"\s]+)['"]?\s*$/.exec(line)
    if (entry === null) break
    globs.push(entry[1])
  }

  return globs.flatMap((glob) => {
    if (!glob.endsWith('/*')) return [join(ROOT, glob)]
    const parent = join(ROOT, glob.slice(0, -2))

    return readdirSync(parent)
      .map((name) => join(parent, name))
      .filter((path) => statSync(path).isDirectory())
  })
}

const packages = packageDirectories().flatMap((dir) => {
  const manifestPath = join(dir, 'package.json')
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    return [] // A workspace directory without a manifest is not a package.
  }
  const declared = { ...manifest.dependencies, ...manifest.devDependencies }
  const exports = Object.keys(manifest.exports ?? { '.': '' })

  const path = relative(ROOT, manifestPath)

  return [{ name: manifest.name, dir, exports, declared: new Set(Object.keys(declared)), path }]
})
const byName = new Map(packages.map((pkg) => [pkg.name, pkg]))

function checkAcyclic() {
  const visiting = new Set()
  const done = new Set()
  const walk = (name, path) => {
    if (done.has(name)) return
    if (visiting.has(name)) {
      const cycle = path.slice(path.indexOf(name))
      return fail(`cycle: ${[...cycle, name].join(' -> ')}`)
    }
    visiting.add(name)
    for (const dependency of byName.get(name)?.declared ?? []) {
      if (byName.has(dependency)) walk(dependency, [...path, name])
    }
    visiting.delete(name)
    done.add(name)
  }
  for (const pkg of packages) walk(pkg.name, [])
}

function checkDirection() {
  for (const pkg of packages) {
    for (const [consumer, forbidden] of FORBIDDEN) {
      if (pkg.name === consumer && pkg.declared.has(forbidden)) {
        fail(`${pkg.path}: ${consumer} must not depend on ${forbidden} (§ Rules)`)
      }
    }
    for (const dependency of pkg.declared) {
      // An app's name carries no scope, which is how a workspace app is told from a package.
      if (byName.has(dependency) && !dependency.startsWith(SCOPE)) {
        fail(`${pkg.path}: nothing may depend on the app '${dependency}' (§ Rules, 5)`)
      }
    }
  }
}

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : sourceFiles(join(dir, entry.name))
    if (entry.name === 'package.json') return []

    return EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [join(dir, entry.name)] : []
  })
}

/** Exports-aware, per § Custom gates: legal when the target declares the subpath. ADR-005. */
const declaresExport = (target, subpath) =>
  (byName.get(target)?.exports ?? []).some((pattern) =>
    new RegExp(`^${pattern.split('*').map(escapeRegex).join('.+')}$`).test(subpath),
  )

function checkImports() {
  for (const pkg of packages) {
    for (const file of sourceFiles(pkg.dir)) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          for (const [, specifier] of line.matchAll(INTERNAL)) {
            const [scope, name, ...rest] = specifier.split('/')
            const target = `${scope}/${name}`
            if (!byName.has(target)) continue
            if (rest.length > 0 && !declaresExport(target, `./${rest.join('/')}`)) {
              fail(`${at(file, index)}: '${specifier}' reaches past ${target}'s exports map`)
            }
            if (target !== pkg.name && !pkg.declared.has(target)) {
              fail(`${at(file, index)}: '${target}' is imported but not declared in ${pkg.name}`)
            }
          }
        })
    }
  }
}

checkAcyclic()
checkDirection()
checkImports()

if (failures.length > 0) {
  console.error(`check-deps: ${failures.length} violation(s)\n`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(`check-deps: ${packages.length} packages, graph clean`)
