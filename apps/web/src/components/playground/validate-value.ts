/**
 * The value check the sandbox applies with — PLAYGROUND.md § Parsing and validation, layers 1 to 3.
 *
 * Prompt 48 moves the full validator into `packages/schema`, where `sanitizeDocument` can call the same
 * code: a second copy of a security boundary is a second thing to keep right. Until then this is the
 * playground's own floor, and it is deliberately the cheap half — structure, the blocklist, and the
 * browser's own answer, which is free and authoritative.
 */
export interface ValueError {
  readonly message: string
  /** 1-based, so it matches what a reader counts in the editor. */
  readonly line: number
}

export type ValueCheck =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly errors: readonly ValueError[] }

/** § Parsing and validation, layer 1: a value, not a rule, and nothing pathological in length. */
const MAX_LENGTH = 8 * 1024

/** Layer 2. Every one of these is a CSS injection vector with no legitimate use in a value here. */
const BLOCKED: readonly { readonly pattern: RegExp; readonly message: string }[] = [
  { pattern: /@import/i, message: '@import is not allowed here.' },
  { pattern: /expression\s*\(/i, message: 'expression() is not allowed here.' },
  { pattern: /behaviou?r\s*:/i, message: 'behavior: is not allowed here.' },
  { pattern: /-moz-binding/i, message: '-moz-binding is not allowed here.' },
  { pattern: /javascript:/i, message: 'javascript: is not allowed here.' },
  {
    // A data URL is the one form the asset sanitizer can vouch for; every other `url()` is a fetch.
    pattern: /url\(\s*(?!["']?data:image\/(?:png|jpeg|gif|webp|svg\+xml);)/i,
    message: 'url() may only load an inline data: image here.',
  },
]

const lineOf = (value: string, index: number): number => value.slice(0, index).split('\n').length

function structural(value: string): readonly ValueError[] {
  const errors: ValueError[] = []
  let depth = 0
  let quote: string | undefined

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (quote !== undefined) {
      if (character === quote) {
        quote = undefined
      }

      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      continue
    }

    if (character === '(') {
      depth += 1
    }

    if (character === ')') {
      depth -= 1

      if (depth < 0) {
        errors.push({
          message: 'Unexpected ")" — more closing than opening parentheses.',
          line: lineOf(value, index),
        })

        return errors
      }
    }

    if (character === '{' || character === '}') {
      errors.push({
        message: 'Write a value, not a rule: braces belong to a stylesheet.',
        line: lineOf(value, index),
      })

      return errors
    }

    if (character === ';') {
      errors.push({
        message: 'Write one value: a semicolon ends a declaration.',
        line: lineOf(value, index),
      })

      return errors
    }
  }

  if (quote !== undefined) {
    errors.push({
      message: `Unclosed ${quote === '"' ? 'double' : 'single'} quote.`,
      line: lineOf(value, value.length),
    })
  }

  if (depth > 0) {
    errors.push({
      message: `Unclosed parenthesis — ${depth} still open.`,
      line: lineOf(value, value.length),
    })
  }

  return errors
}

/**
 * `CSS.supports` is the browser's own answer and the only one that is never out of date. It is absent
 * in a non-DOM environment, and a check that cannot run is not a failure: the structural layer already
 * ran, and refusing every value under a test runner would make the hook untestable.
 */
function supported(property: string, value: string): boolean {
  const api = typeof CSS === 'undefined' ? undefined : CSS

  if (api === undefined || typeof api.supports !== 'function') {
    return true
  }

  return api.supports(property, value)
}

export function validateValue(property: string, input: string): ValueCheck {
  const value = input.trim()

  if (value === '') {
    return { ok: false, errors: [{ message: 'Write a value to see it applied.', line: 1 }] }
  }

  if (value.length > MAX_LENGTH) {
    return {
      ok: false,
      errors: [{ message: `Too long: ${value.length} characters, cap is ${MAX_LENGTH}.`, line: 1 }],
    }
  }

  for (const entry of BLOCKED) {
    const match = entry.pattern.exec(value)

    if (match !== null) {
      return { ok: false, errors: [{ message: entry.message, line: lineOf(value, match.index) }] }
    }
  }

  const errors = structural(value)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  if (!supported(property, value)) {
    return {
      ok: false,
      errors: [{ message: `The browser does not accept this as a ${property} value.`, line: 1 }],
    }
  }

  return { ok: true, value }
}
