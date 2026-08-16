'use client'

/**
 * `Mod+Shift+P` — SHORTCUTS.md § Viewport. An entrance is defined as what happens when an element
 * mounts, so replaying one means mounting it again: this counter is the key the motion wrapper
 * remounts on, and it is the whole of the replay mechanism.
 *
 * It lives outside the document store because it is not a document fact and must not enter history:
 * replaying an entrance is not an edit, and `Mod+Z` after it should undo whatever the user last
 * changed.
 */
let replays = 0

const listeners = new Set<() => void>()

export const motionPlayback = {
  replays: (): number => replays,

  replay(): void {
    replays += 1

    for (const listener of listeners) {
      listener()
    }
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },
}
