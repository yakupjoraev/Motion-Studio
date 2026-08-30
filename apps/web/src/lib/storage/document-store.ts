import { type MotionDocument, documentSchema, nodeIds } from '@motion-studio/schema'
import { createId } from '@motion-studio/utils'

import { STORES, get, keys, put, remove } from './idb'

/** FILE_FORMAT.md § Autosave: the last ten per document, oldest dropped. */
export const SNAPSHOT_LIMIT = 10

export interface StoredDocument {
  readonly document: MotionDocument
  readonly savedAt: number
}

export interface SnapshotMeta {
  /** The IndexedDB key. Opaque, and the only handle the version-history list needs. */
  readonly key: string
  readonly documentId: string
  readonly createdAt: number
  readonly nodeCount: number
}

interface SnapshotRecord extends SnapshotMeta {
  readonly document: MotionDocument
}

/** `doc_` ids are base58, so the separator cannot appear inside one and a prefix match is exact. */
const SEPARATOR = '::'

const snapshotKey = (documentId: string, createdAt: number): string =>
  `${documentId}${SEPARATOR}${createdAt}${SEPARATOR}${createId('snap')}`

/**
 * Everything read back is parsed. A record written by an older build is untrusted input in exactly
 * the way an imported file is, and the schema's defaults are what make it usable rather than dropped.
 */
const parseDocument = (value: unknown): MotionDocument | undefined => {
  const parsed = documentSchema.safeParse(value)

  return parsed.success ? parsed.data : undefined
}

export async function saveDocument(document: MotionDocument, savedAt: number): Promise<void> {
  await put(STORES.documents, document.meta.id, { document, savedAt } satisfies StoredDocument)
}

export async function loadDocument(id: string): Promise<StoredDocument | undefined> {
  const stored = await get<{ document?: unknown; savedAt?: unknown }>(STORES.documents, id)
  const document = parseDocument(stored?.document)

  if (document === undefined) {
    return undefined
  }

  return { document, savedAt: typeof stored?.savedAt === 'number' ? stored.savedAt : 0 }
}

export function listDocumentIds(): Promise<readonly string[]> {
  return keys(STORES.documents)
}

/** Deletes the snapshots with the document: a ring buffer with no document is unreachable storage. */
export async function deleteDocument(id: string): Promise<void> {
  const stale = (await keys(STORES.snapshots)).filter((key) => key.startsWith(`${id}${SEPARATOR}`))

  await Promise.all([
    remove(STORES.documents, id),
    ...stale.map((key) => remove(STORES.snapshots, key)),
  ])
}

const readSnapshotKeys = async (documentId: string): Promise<readonly string[]> =>
  (await keys(STORES.snapshots)).filter((key) => key.startsWith(`${documentId}${SEPARATOR}`))

/** Read off the key rather than the record: listing ten documents must not deserialise ten of them. */
const createdAtOf = (key: string): number => Number(key.split(SEPARATOR)[1] ?? 0)

export async function listSnapshots(documentId: string): Promise<readonly SnapshotMeta[]> {
  const found = await readSnapshotKeys(documentId)
  const records = await Promise.all(found.map((key) => get<SnapshotRecord>(STORES.snapshots, key)))

  const listed = records.flatMap((record, index) => {
    const key = found[index]

    if (record === undefined || key === undefined) {
      return []
    }

    return [{ key, documentId, createdAt: record.createdAt, nodeCount: record.nodeCount }]
  })

  return [...listed].sort((left, right) => right.createdAt - left.createdAt)
}

export async function loadSnapshot(key: string): Promise<MotionDocument | undefined> {
  const record = await get<{ document?: unknown }>(STORES.snapshots, key)

  return parseDocument(record?.document)
}

/**
 * Writes a snapshot and trims the buffer to `SNAPSHOT_LIMIT`. Whether a snapshot is *warranted* is
 * the autosave hook's question (ADR-284); this function is asked, and writes.
 */
export async function takeSnapshot(
  document: MotionDocument,
  createdAt: number,
): Promise<SnapshotMeta> {
  const documentId = document.meta.id
  const meta: SnapshotMeta = {
    key: snapshotKey(documentId, createdAt),
    documentId,
    createdAt,
    nodeCount: nodeIds(document).length,
  }

  await put(STORES.snapshots, meta.key, { ...meta, document } satisfies SnapshotRecord)

  const existing = [...(await readSnapshotKeys(documentId))].sort(
    (left, right) => createdAtOf(right) - createdAtOf(left),
  )

  await Promise.all(existing.slice(SNAPSHOT_LIMIT).map((key) => remove(STORES.snapshots, key)))

  return meta
}
