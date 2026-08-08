/**
 * FILE_FORMAT.md § Security, the CSS row. Each entry is a construct that turns a style declaration
 * into a fetch, a script, or a stylesheet import — the three things a value in a document must never
 * be able to do.
 *
 * The list is deliberately about *constructs*, not about payloads: matching `javascript:` would be a
 * blocklist of one spelling, while banning `url(` removes the whole class, including the ones nobody
 * has thought of yet.
 */
export interface BlocklistEntry {
  readonly id: string
  readonly pattern: RegExp
  readonly reason: string
}

export const CSS_BLOCKLIST: readonly BlocklistEntry[] = [
  {
    id: 'url',
    // Whitespace between `url` and `(` is legal CSS, so the pattern allows it.
    pattern: /url\s*\(/i,
    reason: 'url() would let a document fetch from an arbitrary origin',
  },
  {
    id: 'import',
    pattern: /@import\b/i,
    reason: '@import would pull in a stylesheet this app never validated',
  },
  {
    id: 'expression',
    pattern: /expression\s*\(/i,
    reason: 'expression() executes script in legacy engines',
  },
  {
    id: 'behavior',
    pattern: /\bbehavior\s*:/i,
    reason: 'behavior: binds an HTC file, which runs script',
  },
  {
    id: 'moz-binding',
    pattern: /-moz-binding\b/i,
    reason: '-moz-binding binds XBL, which runs script',
  },
  {
    id: 'element',
    pattern: /element\s*\(/i,
    reason: 'element() renders another part of the page and can leak its content',
  },
]

export interface BlocklistHit {
  readonly id: string
  readonly reason: string
}

export function findBlockedConstructs(value: string): readonly BlocklistHit[] {
  return CSS_BLOCKLIST.filter((entry) => entry.pattern.test(value)).map((entry) => ({
    id: entry.id,
    reason: entry.reason,
  }))
}
