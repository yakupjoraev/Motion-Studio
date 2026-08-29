import { checkImageDataUrl } from '../urls'

import type { CssError } from './css.types'
import { positionAt } from './structural'

/**
 * Layer 2 — FILE_FORMAT.md § Security, the CSS row. Each entry is a construct that turns a style
 * declaration into a fetch, a script, or a stylesheet import: the three things a value in a document
 * must never be able to do.
 *
 * The list is about *constructs*, not payloads. Matching `javascript:` would be a blocklist of one
 * spelling; banning `url(` removes the whole class, including the spellings nobody has thought of.
 */
export interface BlocklistEntry {
  readonly id: string
  readonly pattern: RegExp
  readonly message: string
}

export const CSS_BLOCKLIST: readonly BlocklistEntry[] = [
  {
    id: 'url',
    // Whitespace between `url` and `(` is not valid CSS, but it is a way to write the token that a
    // careless matcher misses, so the pattern allows it and the argument check decides.
    pattern: /url\s*\(/i,
    message: 'url() may only load an inline data: image here.',
  },
  {
    id: 'import',
    pattern: /@import\b/i,
    message: '@import would pull in a stylesheet this app never validated.',
  },
  {
    id: 'expression',
    pattern: /expression\s*\(/i,
    message: 'expression() executes script in legacy engines.',
  },
  {
    id: 'behavior',
    pattern: /\bbehaviou?r\s*:/i,
    message: 'behavior: binds an HTC file, which runs script.',
  },
  {
    id: 'moz-binding',
    pattern: /-moz-binding\b/i,
    message: '-moz-binding binds XBL, which runs script.',
  },
  {
    id: 'element',
    pattern: /element\s*\(/i,
    message: 'element() renders another part of the page and can leak what it shows.',
  },
]

/** Property names that are the vector themselves; both need a `url()`, and both are refused anyway. */
export const BLOCKED_PROPERTIES: ReadonlySet<string> = new Set(['behavior', '-moz-binding'])

const blocked = (value: string, index: number, message: string): CssError => ({
  message,
  ...positionAt(value, index),
  severity: 'error',
  layer: 'blocklist',
})

interface UrlCall {
  readonly index: number
  readonly argument: string
}

/** The text between `url(` and its matching `)`, unquoted. Quote-aware, so `")"` does not close it. */
function urlCalls(value: string): readonly UrlCall[] {
  const calls: UrlCall[] = []
  const opener = /url\s*\(/gi
  let match = opener.exec(value)

  while (match !== null) {
    let depth = 1
    let quote: string | undefined
    let index = match.index + match[0].length

    while (index < value.length && depth > 0) {
      const char = value[index] as string

      if (quote !== undefined) {
        if (char === quote) {
          quote = undefined
        }
      } else if (char === '"' || char === "'") {
        quote = char
      } else if (char === '(') {
        depth += 1
      } else if (char === ')') {
        depth -= 1
      }

      index += 1
    }

    const raw = value.slice(match.index + match[0].length, depth === 0 ? index - 1 : index).trim()
    const unquoted =
      (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw

    calls.push({ index: match.index, argument: unquoted })
    opener.lastIndex = index
    match = opener.exec(value)
  }

  return calls
}

/** ADR-266: the one exception, and it is the one the asset sanitizer can already vouch for. */
const URL_REASON: Readonly<Record<string, string>> = {
  'not-data-url': 'this one is not a data URL',
  type: 'this one is not an allowed image type',
  encoding: 'this one is not base64-encoded',
  size: 'this one is over the size limit',
}

function urlErrors(value: string): readonly CssError[] {
  return urlCalls(value).flatMap((call) => {
    const check = checkImageDataUrl(call.argument)

    if (check.ok) {
      return []
    }

    const reason = URL_REASON[check.reason ?? 'not-data-url'] ?? 'this one is not a data URL'

    return [blocked(value, call.index, `url() may only load an inline data: image — ${reason}.`)]
  })
}

export function findBlockedConstructs(value: string): readonly CssError[] {
  return CSS_BLOCKLIST.flatMap((entry) => {
    if (entry.id === 'url') {
      return urlErrors(value)
    }

    const match = entry.pattern.exec(value)

    return match === null ? [] : [blocked(value, match.index, entry.message)]
  })
}
