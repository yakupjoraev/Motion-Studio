/**
 * JSON the way Prettier writes it, without loading Prettier's JSON parser. Objects expand, arrays of
 * primitives stay on one line while they fit — which is what `create-next-app` emits and therefore what
 * a reader expects `tsconfig.json` and `package.json` to look like.
 *
 * `JSON.stringify(value, null, 2)` is not that: it puts `"lib": ["dom", "dom.iterable", "esnext"]` on
 * three lines and the result reads as machine output, which is the one thing this prompt is about.
 */
const INLINE_WIDTH = 80

const isPrimitive = (value: unknown): boolean =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

export function printJson(value: unknown, depth = 0): string {
  const pad = '  '.repeat(depth)
  const inner = '  '.repeat(depth + 1)

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]'
    }

    if (value.every(isPrimitive)) {
      const single = `[${value.map((member) => JSON.stringify(member)).join(', ')}]`

      if (pad.length + single.length <= INLINE_WIDTH) {
        return single
      }
    }

    const members = value.map((member) => `${inner}${printJson(member, depth + 1)}`)

    return `[\n${members.join(',\n')}\n${pad}]`
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)

    if (entries.length === 0) {
      return '{}'
    }

    const members = entries.map(
      ([key, member]) => `${inner}${JSON.stringify(key)}: ${printJson(member, depth + 1)}`,
    )

    return `{\n${members.join(',\n')}\n${pad}}`
  }

  return JSON.stringify(value)
}

/** A whole file: the value, and the trailing newline every file in this repository ends with. */
export const printJsonFile = (value: unknown): string => `${printJson(value)}\n`
