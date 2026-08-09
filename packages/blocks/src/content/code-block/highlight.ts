/**
 * A small tokeniser, not `shiki`.
 *
 * ADR-124 records the measurement. The short version: `shiki` ships a WASM regex engine and a grammar
 * per language, the studio's first-load budget is 250 kB with single-digit kilobytes to spare, and the
 * code a user types into a canvas has to be highlighted *at runtime* — the "build-time for known
 * content" half of the idea has no content to apply to inside an editor. What a code sample on a
 * marketing page needs is five colours that make structure legible, and that is what this produces.
 *
 * It is deliberately not a parser. It cannot be wrong in a way that matters, because the worst failure
 * is a word painted the wrong colour in a block whose text is already correct and selectable.
 */
import type { Language } from './code-block.languages'

export const TOKEN_KINDS = ['comment', 'string', 'number', 'keyword', 'plain'] as const

export type TokenKind = (typeof TOKEN_KINDS)[number]

export interface Token {
  readonly kind: TokenKind
  readonly text: string
}

const KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  ts: [
    'import',
    'export',
    'from',
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'for',
    'while',
    'class',
    'extends',
    'new',
    'await',
    'async',
    'type',
    'interface',
    'as',
    'default',
    'true',
    'false',
    'null',
    'undefined',
    'this',
    'throw',
    'try',
    'catch',
    'readonly',
  ],
  css: ['important', 'media', 'supports', 'import', 'theme', 'layer', 'keyframes'],
  bash: ['cd', 'echo', 'export', 'if', 'then', 'fi', 'for', 'do', 'done', 'npx', 'pnpm', 'npm'],
  json: ['true', 'false', 'null'],
}

const keywordsFor = (language: Language): readonly string[] => {
  if (language === 'js' || language === 'tsx' || language === 'jsx' || language === 'ts') {
    return KEYWORDS['ts'] ?? []
  }

  return KEYWORDS[language] ?? []
}

/** Order matters: a comment marker inside a string is not a comment, so strings are matched first. */
const PATTERNS: readonly { readonly kind: TokenKind; readonly re: RegExp }[] = [
  { kind: 'string', re: /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/ },
  { kind: 'comment', re: /^(?:\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/ },
  { kind: 'number', re: /^\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/i },
  { kind: 'plain', re: /^[A-Za-z_$][\w$]*/ },
]

export function tokenize(source: string, language: Language): readonly Token[] {
  if (language === 'plain') {
    return source === '' ? [] : [{ kind: 'plain', text: source }]
  }

  const keywords = keywordsFor(language)
  const tokens: Token[] = []
  let rest = source
  let pending = ''

  const flush = (): void => {
    if (pending !== '') {
      tokens.push({ kind: 'plain', text: pending })
      pending = ''
    }
  }

  while (rest !== '') {
    let matched = false

    for (const { kind, re } of PATTERNS) {
      const found = re.exec(rest)

      if (found === null) {
        continue
      }

      const text = found[0]
      const resolved: TokenKind = kind === 'plain' && keywords.includes(text) ? 'keyword' : kind

      // An identifier that is not a keyword is ordinary text, so it joins the run beside it rather
      // than becoming a span of its own — one span per word would triple the DOM for no colour.
      if (resolved === 'plain') {
        pending += text
      } else {
        flush()
        tokens.push({ kind: resolved, text })
      }

      rest = rest.slice(text.length)
      matched = true
      break
    }

    if (!matched) {
      pending += rest[0] ?? ''
      rest = rest.slice(1)
    }
  }

  flush()

  return tokens
}

/**
 * `2-4,7` → `[2, 3, 4, 7]`. Invalid input yields nothing rather than throwing: the value comes from a
 * text field somebody is still typing into, and a half-written range is not an error yet.
 */
export function parseHighlightLines(value: string): readonly number[] {
  const lines = new Set<number>()

  for (const part of value.split(',')) {
    const trimmed = part.trim()

    if (trimmed === '') {
      continue
    }

    const range = /^(\d+)\s*-\s*(\d+)$/.exec(trimmed)

    if (range !== null) {
      const from = Number(range[1])
      const to = Number(range[2])

      if (from >= 1 && to >= from && to - from <= 500) {
        for (let line = from; line <= to; line += 1) {
          lines.add(line)
        }
      }

      continue
    }

    if (/^\d+$/.test(trimmed) && Number(trimmed) >= 1) {
      lines.add(Number(trimmed))
    }
  }

  return [...lines].sort((a, b) => a - b)
}
