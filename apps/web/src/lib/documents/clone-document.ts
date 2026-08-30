import { type MotionDocument, documentSchema } from '@motion-studio/schema'
import { createId } from '@motion-studio/utils'

export interface CloneOptions {
  readonly name?: string
  /** Injected so a test gets the same clone twice — TESTING.md § Determinism. */
  readonly ids?: (prefix: string) => string
  readonly now?: () => Date
}

/** Every id in the file carries its kind as a prefix, which is what makes a blind remap safe. */
const ID_PREFIXES = ['node_', 'asset_', 'fx_'] as const

const isId = (value: string): boolean => ID_PREFIXES.some((prefix) => value.startsWith(prefix))

/**
 * Replaces every string that is an id. Asset ids appear inside block props as plain strings — that is
 * what `removeNodes` walks for too — so remapping the maps alone would leave a clone pointing at its
 * source's assets.
 */
const remap = (value: unknown, ids: ReadonlyMap<string, string>): unknown => {
  if (typeof value === 'string') {
    return ids.get(value) ?? value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => remap(entry, ids))
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [ids.get(key) ?? key, remap(entry, ids)]),
    )
  }

  return value
}

/**
 * A document with the same content and none of the same ids — FILE_FORMAT.md § Templates: "Loading
 * one clones it with fresh ids so a user cannot accidentally overwrite a template." The same function
 * is what `Duplicate` in the document list calls, because the requirement is identical.
 *
 * `template` is dropped: a copy of a template is a document.
 */
export function cloneDocument(
  document: MotionDocument,
  options: CloneOptions = {},
): MotionDocument {
  const generate = options.ids ?? createId
  const now = (options.now ?? (() => new Date()))().toISOString()
  const ids = new Map<string, string>()

  for (const id of Object.keys(document.nodes)) {
    ids.set(id, generate('node'))
  }

  for (const id of Object.keys(document.assets)) {
    ids.set(id, generate('asset'))
  }

  for (const node of Object.values(document.nodes)) {
    for (const effect of node.effects) {
      ids.set(effect.id, generate('fx'))
    }
  }

  // Only ids go into the map, so a prop whose *value* happens to match a key cannot be rewritten.
  for (const key of ids.keys()) {
    if (!isId(key)) {
      ids.delete(key)
    }
  }

  const cloned = remap(
    { ...document, meta: { ...document.meta, template: undefined } },
    ids,
  ) as MotionDocument

  return documentSchema.parse({
    ...cloned,
    meta: {
      ...cloned.meta,
      id: generate('doc'),
      name: options.name ?? cloned.meta.name,
      createdAt: now,
      updatedAt: now,
    },
  })
}
