#!/usr/bin/env node
/**
 * Conventional Commits gate, per `CONTRIBUTING.md` § Commit convention. Takes either a path to a
 * message file — which is what git passes a `commit-msg` hook — or the message itself as an argument.
 *
 * It also rejects tooling and assistant attribution. `docs/DEVOPS.md` § Git hooks states the reason:
 * the repository history should read as the work of its author.
 */
import { readFileSync, statSync } from 'node:fs'

const TYPES = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'style']

/**
 * Every workspace package, plus the three cross-cutting scopes. `CONTRIBUTING.md` § Commit convention is
 * the source: its rule is that scopes match package names, so a new package adds a row here and there.
 */
const SCOPES = [
  'web',
  'storybook',
  'ui',
  'blocks',
  'editor',
  'canvas',
  'dnd',
  'codegen',
  'schema',
  'motion',
  'theme',
  'tokens',
  'icons',
  'hooks',
  'utils',
  'config',
  'e2e',
  'ci',
  'docs',
]

const ATTRIBUTION = [
  /co-authored-by:.*\b(?:claude|copilot|gpt|chatgpt|gemini|cursor)\b/i,
  /\bgenerated with\b/i,
  /\bai[- ]assisted\b/i,
  /\bwith the help of (?:an )?ai\b/i,
  /🤖/u,
]

const SUBJECT_LIMIT = 72

const input = process.argv[2]

if (input === undefined) {
  console.error('check-commit-msg: pass a message or the path to a message file')
  process.exit(1)
}

/** git hands the hook a path; a human running this by hand hands it the message. */
const isPath = (() => {
  try {
    return statSync(input).isFile()
  } catch {
    return false
  }
})()

const message = isPath ? readFileSync(input, 'utf8') : input

// A commented line in a message file is git's own template, not the author's text.
const lines = message.split('\n').filter((line) => !line.startsWith('#'))
const [subject = ''] = lines
const errors = []

// The scope class carries a digit because `e2e` is in the list above and could never match without one.
const header = /^([a-z]+)(?:\(([a-z0-9-]+)\))?(!)?: (.+)$/.exec(subject)

if (header === null) {
  errors.push(`subject must be 'type(scope): subject' — received: ${JSON.stringify(subject)}`)
} else {
  const [, type, scope, , text] = header

  if (!TYPES.includes(type)) {
    errors.push(`'${type}' is not an allowed type. CONTRIBUTING.md allows: ${TYPES.join(', ')}`)
  }
  if (scope !== undefined && !SCOPES.includes(scope)) {
    errors.push(`'${scope}' is not an allowed scope. CONTRIBUTING.md allows: ${SCOPES.join(', ')}`)
  }
  // The first character, not the whole subject: `docs: correct the OKLCH parser name` is correct
  // English and correct convention, and a rule banning every capital would reject it.
  if (text.charAt(0) !== text.charAt(0).toLowerCase()) {
    errors.push(`subject starts with a capital: ${JSON.stringify(text)}`)
  }
  if (text.endsWith('.')) {
    errors.push('subject takes no trailing period')
  }
  if (subject.length > SUBJECT_LIMIT) {
    errors.push(`subject is ${subject.length} characters, over the ${SUBJECT_LIMIT} limit`)
  }
}

for (const pattern of ATTRIBUTION) {
  if (pattern.test(message)) {
    errors.push(
      `message carries tooling attribution (${pattern.source}) — the history is the author's`,
    )
  }
}

if (errors.length > 0) {
  console.error(`check-commit-msg: ${errors.length} problem(s)\n`)
  for (const error of errors) console.error(`  ${error}`)
  console.error('\nExample: feat(canvas): add alignment guides with 4px snap threshold')
  process.exit(1)
}

console.log('check-commit-msg: ok')
