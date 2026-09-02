'use client'

import type { MotionDocument } from '@motion-studio/schema'

import { listDocumentIds, loadDocument } from '../storage/document-store'
import { readPending } from '../storage/pending-write'

/**
 * Where the user's work is, in the order it is most likely to be current — `prompts/58` § The
 * document is always retrievable.
 *
 * The rule this exists for is that a crash must never lose the document, and the awkward case is the
 * one where **the store is the thing that broke**. So the live store is only the first of three
 * lanes, and every lane is wrapped: a boundary that throws while trying to recover from a throw
 * leaves the user with nothing at all.
 */
export type DocumentSource = 'store' | 'autosave' | 'unload-lane'

export interface RecoveredDocument {
  readonly document: MotionDocument
  readonly source: DocumentSource
}

export interface RecoverOptions {
  /** Injected so a boundary can hand over whatever it still has — and so tests can break it. */
  readonly fromStore: () => MotionDocument | null
}

/**
 * The last document IndexedDB holds, by the most recent save.
 *
 * A session can have written several: `File → New` starts a document of its own, and each is keyed
 * by its id. Which one the user was looking at is not knowable from here once the store is gone, so
 * the most recently saved is the honest guess and the file name says which document it is.
 */
const fromAutosave = async (): Promise<MotionDocument | null> => {
  try {
    const ids = await listDocumentIds()
    const stored = await Promise.all(ids.map((id) => loadDocument(id)))
    const best = stored
      .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
      .sort((left, right) => right.savedAt - left.savedAt)[0]

    return best?.document ?? null
  } catch {
    // IndexedDB is absent in a private window on some browsers, and blocked by a storage policy on
    // others. Both are "no document here", not a second failure to report.
    return null
  }
}

const fromUnloadLane = (): MotionDocument | null => {
  try {
    return readPending()?.document ?? null
  } catch {
    return null
  }
}

export async function recoverDocument({
  fromStore,
}: RecoverOptions): Promise<RecoveredDocument | null> {
  try {
    const live = fromStore()

    if (live !== null) {
      return { document: live, source: 'store' }
    }
  } catch {
    // The store is what broke. That is the case the other two lanes exist for.
  }

  const autosaved = await fromAutosave()

  if (autosaved !== null) {
    return { document: autosaved, source: 'autosave' }
  }

  const pending = fromUnloadLane()

  return pending === null ? null : { document: pending, source: 'unload-lane' }
}
