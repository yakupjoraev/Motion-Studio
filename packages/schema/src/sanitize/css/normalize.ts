/**
 * Layer 5 — ADR-269. The value is re-emitted in one spelling, so two documents that mean the same
 * thing serialise the same way and a diff shows real edits.
 *
 * Normalising *after* the checks is deliberate: normalising first would let a payload be rewritten
 * into something the blocklist no longer recognises.
 *
 * What it rewrites is narrow, and the boundary is "can an author's own name appear here". Function
 * names and hex colours are case-insensitive and never author-named, so they are lowercased. Custom
 * properties, font names and anything inside quotes are left byte-for-byte.
 */
const TOKEN_END = /[\s(),[\]'"]/

/** The index one past the closing quote, or the end of the string when it never closes. */
function endOfString(value: string, start: number): number {
  const quote = value[start]

  for (let index = start + 1; index < value.length; index += 1) {
    if (value[index] === quote) {
      return index + 1
    }
  }

  return value.length
}

/** The index of the `)` that closes the `(` at `start`. Quote-aware, so `")"` does not close it. */
function endOfCall(value: string, start: number): number {
  let depth = 0
  let quote: string | undefined

  for (let index = start; index < value.length; index += 1) {
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

      if (depth === 0) {
        return index
      }
    }
  }

  return value.length - 1
}

const HEX = /^#[0-9a-f]+$/i

/**
 * A function name and a hex colour are lowercased; every other run is the author's. A custom property
 * keeps its case for a harder reason than taste: `var(--brandBlue)` and `var(--brandblue)` are two
 * different properties.
 */
function normalizeRun(run: string, isFunctionName: boolean): string {
  if (isFunctionName) {
    return run.startsWith('--') ? run : run.toLowerCase()
  }

  return HEX.test(run) ? run.toLowerCase() : run
}

export function normalizeCssValue(value: string): string {
  const source = value.trim()
  let out = ''
  let pending = false
  let index = 0

  const push = (text: string, spaced: boolean): void => {
    if (spaced && pending && out !== '' && !out.endsWith('(') && !out.endsWith('[')) {
      out += ' '
    }

    pending = false
    out += text
  }

  while (index < source.length) {
    const char = source[index] as string

    if (char === '"' || char === "'") {
      const end = endOfString(source, index)

      push(source.slice(index, end), true)
      index = end
      continue
    }

    if (/\s/.test(char)) {
      pending = out !== ''
      index += 1
      continue
    }

    if (TOKEN_END.test(char)) {
      push(char, char === '(' || char === '[')
      // Exactly one space after a comma, whichever way the author wrote it.
      pending = char === ','
      index += 1
      continue
    }

    let end = index

    while (end < source.length && !TOKEN_END.test(source[end] as string)) {
      end += 1
    }

    const run = source.slice(index, end)
    let ahead = end

    while (ahead < source.length && /\s/.test(source[ahead] as string)) {
      ahead += 1
    }

    const call = source[ahead] === '('

    /*
     * A `url()` argument is one token to CSS: an unquoted data URL carries commas and semicolons that
     * mean nothing to the value grammar, and spacing them out would break the URL. It is copied.
     */
    if (call && run.toLowerCase() === 'url') {
      const close = endOfCall(source, ahead)

      push('url', true)
      out += source.slice(ahead, close + 1)
      index = close + 1
      continue
    }

    push(normalizeRun(run, call), true)
    index = end
  }

  return out
}
