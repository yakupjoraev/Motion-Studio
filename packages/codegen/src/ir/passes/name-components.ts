import { BLOCK_CATEGORIES } from '@motion-studio/schema'
import { kebab, pascal } from '@motion-studio/utils'

import { hash } from '../../hash'
import type { ComponentName } from '../ir.types'

/**
 * Pass 2 — EXPORT_ENGINE.md § Naming. Four guarantees: a valid JS identifier, PascalCase, unique
 * within the export, and **stable** — the same document produces the same names on every run, so
 * re-exporting a page produces a diff a reader can read.
 *
 * Stability is why nothing here consults a counter or a set it does not own: the candidate is a pure
 * function of the node's own name, and only `uniqueName` sees the export, in document order.
 */
export const MAX_COMPONENT_NAME = 40

const SUFFIX = 'Section'

/** Case-insensitive, as EXPORT_ENGINE.md's `"class" → ClassSection` row requires. */
const RESERVED = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'nan',
  'infinity',
  'undefined',
])

/**
 * A name that would read as a category rather than as a component: the nine categories, plus the two
 * role words EXPORT_ENGINE.md's table names — `Hero` and `CTA` — and `section` itself.
 *
 * `page`, `main` and `container` are deliberately absent. Reading the IR of the full-landing fixture is
 * what put them there and then took them out: the entry component of a page is called `Page`, and
 * `PageSection` was a worse name than the one the document already had.
 */
const GENERIC = new Set([...Object.keys(BLOCK_CATEGORIES), 'cta', 'section'])

/** Latin letters with diacritics carry the word; other scripts do not survive an identifier. */
const deaccent = (input: string): string => input.normalize('NFD').replace(/\p{Diacritic}/gu, '')

const TRAILING_DIGITS = /(\d+)$/

/**
 * Words whose first character is a digit move to the end rather than being dropped, so `1st section`
 * keeps its ordinal: `Section1st`, exactly as the document's table specifies.
 */
function letterFirst(words: readonly string[]): readonly string[] {
  const leading = words.findIndex((word) => !/^\d/.test(word))

  return leading <= 0 ? words : [...words.slice(leading), ...words.slice(0, leading)]
}

const splitWords = (input: string): readonly string[] =>
  deaccent(input)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word.length > 0)

/** Four characters of digest, so two names truncated to the same 36 stay distinguishable. */
const suffixHash = (input: string): string => hash(input).slice(0, 4).padEnd(4, '0')

function truncate(name: string): string {
  return name.length <= MAX_COMPONENT_NAME
    ? name
    : name.slice(0, MAX_COMPONENT_NAME - 4) + suffixHash(name)
}

/**
 * `fallback` is what an empty or unwritable name becomes: the block's own name and the node's ordinal,
 * which is the document's `"" → Section3` row.
 */
export function toComponentName(raw: string, fallback: string): ComponentName {
  const words = letterFirst(splitWords(raw))
  const candidate = pascal(words.join(' '))
  const base = candidate === '' ? pascal(fallback) : candidate

  if (base === '') {
    return SUFFIX
  }

  const digits = TRAILING_DIGITS.exec(base)?.[1] ?? ''
  const stem = digits === '' ? base : base.slice(0, base.length - digits.length)
  const needsSuffix =
    stem !== '' &&
    !stem.endsWith(SUFFIX) &&
    (GENERIC.has(stem.toLowerCase()) || RESERVED.has(stem.toLowerCase()))
  const withSuffix = needsSuffix ? `${stem}${SUFFIX}${digits}` : base

  return truncate(/^\d/.test(withSuffix) ? `${SUFFIX}${withSuffix}` : withSuffix)
}

/**
 * The collision guard. `HeroSection` twice becomes `HeroSection` and `HeroSection2` — the ordinal, not
 * the node id, because a name a reader can say out loud is the point of the pass.
 */
export function uniqueName(candidate: ComponentName, taken: ReadonlySet<string>): ComponentName {
  if (!taken.has(candidate)) {
    return candidate
  }

  for (let ordinal = 2; ; ordinal += 1) {
    const suffix = String(ordinal)
    const stem = candidate.slice(0, Math.min(candidate.length, MAX_COMPONENT_NAME - suffix.length))
    const next = `${stem}${suffix}`

    if (!taken.has(next)) {
      return next
    }
  }
}

/** `hero-section.tsx`. The kebab-case of the component name, and the language's own extension. */
export const fileNameFor = (name: ComponentName, language: 'ts' | 'js'): string =>
  `${kebab(name)}.${language === 'ts' ? 'tsx' : 'jsx'}`
