/**
 * FNV-1a, 32 bit, base36. Three things in `buildIR` need a content hash — subtree shapes, motion
 * fragments, and the suffix on a truncated component name — and all three need the same property:
 * the same input produces the same digest in this process, in the next one, and on another machine.
 *
 * Not a cryptographic digest, and it does not need to be: nothing here is a security boundary, and
 * `node:crypto` would put a built-in in the graph of a package that runs in a browser tab.
 */
const OFFSET = 0x811c9dc5
const PRIME = 0x01000193

export function hash(input: string): string {
  let value = OFFSET

  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index)
    value = Math.imul(value, PRIME)
  }

  return (value >>> 0).toString(36)
}

/**
 * A hash of a value's structure, stable across key order. `JSON.stringify` on an object literal
 * follows insertion order, so two documents that differ only in the order the editor happened to
 * write two props would otherwise hash differently and defeat every dedupe in the pipeline.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null'
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)

  return `{${entries.join(',')}}`
}

export const hashValue = (value: unknown): string => hash(stableStringify(value))
