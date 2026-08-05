#!/usr/bin/env node
/**
 * Staged-content scan, per `docs/DEVOPS.md` § Git hooks: cheap insurance in a repo that will be
 * public. Takes file paths as arguments — lefthook passes `{staged_files}` — and reports the file and
 * line of anything that should never leave a machine.
 *
 * Absolute local paths are in the list for the same reason as keys: `C:\Users\<name>\...` in a source
 * file leaks who built it and breaks on every other machine.
 */
import { readFileSync, statSync } from 'node:fs'

const PATTERNS = [
  [/\bsk-[A-Za-z0-9_-]{16,}/, 'OpenAI-style secret key'],
  [/\bpk_(?:live|test)_[A-Za-z0-9]{16,}/, 'publishable key'],
  [/\bghp_[A-Za-z0-9]{20,}/, 'GitHub personal access token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/^\s*(?:export\s+)?[A-Z][A-Z0-9_]*_(?:KEY|SECRET|TOKEN|PASSWORD)\s*=\s*\S/, '.env assignment'],
  [/[A-Za-z]:\\Users\\/, 'absolute Windows path'],
  [/\/(?:Users|home)\/[A-Za-z0-9._-]+\//, 'absolute local path'],
]

/** This file states every pattern it forbids, so scanning it would report itself. */
const SELF = 'check-secrets.mjs'

const findings = []

for (const path of process.argv.slice(2)) {
  if (path.endsWith(SELF)) continue
  try {
    if (!statSync(path).isFile()) continue
  } catch {
    continue // Deleted in the same commit: nothing to scan.
  }

  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      for (const [pattern, label] of PATTERNS) {
        if (pattern.test(line)) findings.push(`${path}:${index + 1}: ${label}`)
      }
    })
}

if (findings.length > 0) {
  console.error(`check-secrets: ${findings.length} finding(s)\n`)
  for (const finding of findings) console.error(`  ${finding}`)
  console.error('\nRemove it, or move the value behind an environment variable.')
  process.exit(1)
}

console.log(`check-secrets: ${process.argv.length - 2} file(s) clean`)
