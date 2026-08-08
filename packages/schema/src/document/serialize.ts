import type { MotionDocument } from './document.types'

/**
 * Schema order first, then alphabetical for anything this table does not name. FILE_FORMAT.md
 * § Export: a re-saved document with no edits is byte-identical, so `.motion` files diff cleanly in
 * git. `JSON.stringify` emits insertion order, so the order is produced by rebuilding each object
 * rather than by asking the serialiser for it.
 */
const KEY_ORDER: Readonly<Record<string, readonly string[]>> = {
  document: ['$schema', 'version', 'meta', 'theme', 'rootId', 'nodes', 'assets'],
  meta: ['id', 'name', 'createdAt', 'updatedAt', 'generator', 'canvas', 'template'],
  node: [
    'id',
    'blockId',
    'name',
    'parentId',
    'slot',
    'children',
    'props',
    'responsive',
    'motion',
    'effects',
    'locked',
    'hidden',
  ],
  effect: ['id', 'effectId', 'params', 'layer', 'blendMode', 'opacity'],
  asset: ['id', 'kind', 'source', 'width', 'height', 'alt', 'blurDataUrl'],
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Orders `value`'s own keys by `preferred`, then alphabetically, and recurses. A record keyed by id
 * (`nodes`, `assets`) sorts alphabetically, which is stable across sessions because ids never change
 * once assigned.
 */
function ordered(value: unknown, preferred: readonly string[] = []): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => ordered(entry, orderFor(entry)))
  }

  if (!isPlainObject(value)) {
    return value
  }

  const keys = Object.keys(value)
  const named = preferred.filter((key) => keys.includes(key))
  const rest = keys.filter((key) => !named.includes(key)).sort()
  const result: Record<string, unknown> = {}

  for (const key of [...named, ...rest]) {
    result[key] = ordered(value[key], orderFor(value[key]))
  }

  return result
}

/** Which row of `KEY_ORDER` applies is decided by shape, so a nested node is ordered like a node. */
function orderFor(value: unknown): readonly string[] {
  if (!isPlainObject(value)) {
    return []
  }

  if ('blockId' in value && 'children' in value) {
    return KEY_ORDER['node'] ?? []
  }

  if ('effectId' in value) {
    return KEY_ORDER['effect'] ?? []
  }

  if ('kind' in value && 'source' in value) {
    return KEY_ORDER['asset'] ?? []
  }

  if ('generator' in value && 'canvas' in value) {
    return KEY_ORDER['meta'] ?? []
  }

  return []
}

export function withStableKeyOrder(document: MotionDocument): unknown {
  return ordered(document, KEY_ORDER['document'] ?? [])
}

/** Two-space indent and a trailing newline, so the file ends the way every other text file does. */
export function serializeDocument(document: MotionDocument): string {
  return `${JSON.stringify(withStableKeyOrder(document), null, 2)}\n`
}
