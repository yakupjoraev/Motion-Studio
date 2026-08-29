import type { CssError, Position } from './css.types'

/**
 * Layers 1 of PLAYGROUND.md § Parsing and validation: is this shaped like a declaration value at all?
 *
 * It runs before the blocklist because an unbalanced string or an interleaved comment is what lets a
 * payload hide from a pattern — both read as one construct to a browser and as noise to a regex. It is
 * also the layer the playground runs undebounced, so a missing bracket is reported while the reader is
 * still holding the key down.
 */

/** ADR-267: the document's number. Large enough for a stacked gradient, small enough to be a guard. */
export const MAX_VALUE_LENGTH = 8 * 1024

export function positionAt(value: string, index: number): Position {
  const before = value.slice(0, index)
  const newline = before.lastIndexOf('\n')

  return { line: before.split('\n').length, column: index - newline }
}

const structural = (value: string, index: number, message: string): CssError => ({
  message,
  ...positionAt(value, index),
  severity: 'error',
  layer: 'structural',
})

interface Delimiters {
  readonly parenOpen: number
  readonly parenClose: number
  readonly bracketOpen: number
  readonly bracketClose: number
}

/** Only ever called to write an error message, so the second walk costs nothing anyone waits for. */
function countDelimiters(value: string): Delimiters {
  let parenOpen = 0
  let parenClose = 0
  let bracketOpen = 0
  let bracketClose = 0
  let quote: string | undefined

  for (const char of value) {
    if (quote !== undefined) {
      if (char === quote) {
        quote = undefined
      }

      continue
    }

    if (char === '"' || char === "'") {
      quote = char
    } else if (char === '(') {
      parenOpen += 1
    } else if (char === ')') {
      parenClose += 1
    } else if (char === '[') {
      bracketOpen += 1
    } else if (char === ']') {
      bracketClose += 1
    }
  }

  return { parenOpen, parenClose, bracketOpen, bracketClose }
}

/** "3 open parens, 4 closing" — the count is what tells a reader which end to go looking at. */
function tally(value: string, char: string): string {
  const counts = countDelimiters(value)

  return char === '(' || char === ')'
    ? `${counts.parenOpen} open parens, ${counts.parenClose} closing`
    : `${counts.bracketOpen} open brackets, ${counts.bracketClose} closing`
}

interface Opener {
  readonly char: '(' | '['
  readonly index: number
}

const CLOSER = { '(': ')', '[': ']' } as const

export function findStructuralErrors(value: string): readonly CssError[] {
  if (value.length > MAX_VALUE_LENGTH) {
    return [
      structural(
        value,
        MAX_VALUE_LENGTH,
        `Too long: ${value.length} characters, cap is ${MAX_VALUE_LENGTH}.`,
      ),
    ]
  }

  const open: Opener[] = []
  let quote: '"' | "'" | undefined
  let quoteIndex = 0

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index] as string

    if (quote !== undefined) {
      if (char === quote) {
        quote = undefined
      }

      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      quoteIndex = index
      continue
    }

    // ADR-270: inside a string an escape spells text; outside one it can spell `url(`.
    if (char === '\\') {
      return [
        structural(
          value,
          index,
          'A backslash can spell a blocked construct, so it is not allowed.',
        ),
      ]
    }

    if ((char === '/' && value[index + 1] === '*') || (char === '*' && value[index + 1] === '/')) {
      return [structural(value, index, 'Comments are not allowed in a value.')]
    }

    if (char === '{' || char === '}') {
      return [structural(value, index, 'Write a value, not a rule: braces belong to a stylesheet.')]
    }

    // A `;` inside parens is part of a token — a data URL carries one — so only a top-level one ends
    // a declaration, and a value holds exactly one.
    if (char === ';' && open.length === 0) {
      return [structural(value, index, 'Write one declaration: a semicolon ends it.')]
    }

    /*
     * No CSS value has a top-level colon: every one that looks like it — a data URL, a `content`
     * string — is inside a call or a string. So a colon out here is the second declaration of a list
     * whose first one never ended, and saying that is more use than letting layer 3 call it invalid.
     */
    if (char === ':' && open.length === 0) {
      return [
        structural(
          value,
          index,
          "Unexpected ':' — write a value here, or end the declaration before it with ';'.",
        ),
      ]
    }

    if (char === '(' || char === '[') {
      open.push({ char, index })
      continue
    }

    if (char === ')' || char === ']') {
      const opener = open.pop()

      if (opener === undefined) {
        return [structural(value, index, `Unexpected '${char}' — ${tally(value, char)}.`)]
      }

      if (CLOSER[opener.char] !== char) {
        const at = positionAt(value, opener.index)

        return [
          structural(
            value,
            index,
            `Unexpected '${char}' — the '${opener.char}' at line ${at.line} column ${at.column} is still open.`,
          ),
        ]
      }
    }
  }

  if (quote !== undefined) {
    const kind = quote === '"' ? 'double' : 'single'

    return [structural(value, quoteIndex, `Unclosed ${kind} quote.`)]
  }

  const unclosed = open[0]

  return unclosed === undefined
    ? []
    : [
        structural(
          value,
          unclosed.index,
          `Unclosed '${unclosed.char}' — ${tally(value, unclosed.char)}.`,
        ),
      ]
}

/** One `property: value` pair out of a declaration list, with where it was written. */
export interface RawDeclaration {
  readonly property: string
  readonly value: string
  readonly position: Position
  readonly valuePosition: Position
}

export interface DeclarationSplit {
  readonly declarations: readonly RawDeclaration[]
  readonly errors: readonly CssError[]
}

/** Offsets of the top-level occurrences of `char`: the same walk that answers "is this balanced". */
function topLevelIndices(input: string, char: ';' | ':'): readonly number[] {
  const indices: number[] = []
  let depth = 0
  let quote: string | undefined

  for (let index = 0; index < input.length; index += 1) {
    const current = input[index] as string

    if (quote !== undefined) {
      if (current === quote) {
        quote = undefined
      }

      continue
    }

    if (current === '"' || current === "'") {
      quote = current
    } else if (current === '(' || current === '[') {
      depth += 1
    } else if (current === ')' || current === ']') {
      depth = Math.max(0, depth - 1)
    } else if (current === char && depth === 0) {
      indices.push(index)
    }
  }

  return indices
}

/** The offset of the first non-space character at or after `from`. */
const skipSpace = (input: string, from: number, to: number): number => {
  let index = from

  while (index < to && /\s/.test(input[index] as string)) {
    index += 1
  }

  return index
}

/**
 * A `css` escape-hatch prop and the inspector's field hold declarations, not a value — ADR-265. The
 * split happens here rather than in the composer because "does this `;` end a declaration" is the same
 * question as "is this paren balanced", and it is answered by the same walk.
 */
export function splitDeclarations(input: string): DeclarationSplit {
  const declarations: RawDeclaration[] = []
  const errors: CssError[] = []
  const bounds = [...topLevelIndices(input, ';'), input.length]
  let start = 0

  for (const end of bounds) {
    const from = skipSpace(input, start, end)
    const chunk = input.slice(from, end).trimEnd()

    start = end + 1

    if (chunk === '') {
      continue
    }

    const colon = topLevelIndices(chunk, ':')[0]

    if (colon === undefined) {
      errors.push(structural(input, from, 'Expected `property: value`.'))
      continue
    }

    const valueFrom = skipSpace(chunk, colon + 1, chunk.length)

    declarations.push({
      property: chunk.slice(0, colon).trim(),
      value: chunk.slice(valueFrom),
      position: positionAt(input, from),
      valuePosition: positionAt(input, from + valueFrom),
    })
  }

  return { declarations, errors }
}
