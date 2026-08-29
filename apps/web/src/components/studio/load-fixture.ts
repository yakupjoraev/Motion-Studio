'use client'

import { documentSchema } from '@motion-studio/schema'

import { useStudioStore } from '../../store/editor-store'

/**
 * Loads a committed stress document into the store — TESTING.md § Determinism: a performance run
 * loads a fixture rather than building state by clicking, which is both faster and the only way two
 * runs measure the same thing.
 *
 * The response is parsed by the document schema before it reaches the store: it arrives over the
 * network, and every invariant downstream assumes a document that has been through the schema.
 */
export async function loadFixture(name: string, signal?: AbortSignal): Promise<void> {
  const response = await fetch(`/fixtures/${encodeURIComponent(name)}`, {
    ...(signal === undefined ? {} : { signal }),
  })

  if (!response.ok) {
    throw new Error(`No fixture named “${name}” (${response.status})`)
  }

  useStudioStore.getState().replaceDocument(documentSchema.parse(await response.json()))

  // What a performance run waits for: the document is in the store, not "the request came back".
  document.documentElement.dataset['fixture'] = name
}

/**
 * `/studio?fixture=stress-motion-heavy`. The whole module is imported dynamically by the studio's
 * first effect, so a session nobody asked a fixture for downloads none of it — PERFORMANCE.md
 * § Bundle policy, and the studio's first load has 250 kB to spend on the studio.
 */
export function loadFixtureFromQuery(signal: AbortSignal): void {
  const name = new URLSearchParams(window.location.search).get('fixture')

  if (name === null || name === '') {
    return
  }

  /*
   * Once per session. Returning to the studio from another route re-mounts the shell, and reloading
   * the fixture there would throw away everything done to the document since — including a value
   * just sent from the playground, which is the trip this has to survive.
   */
  if (document.documentElement.dataset['fixture'] === name) {
    return
  }

  loadFixture(name, signal).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    throw error
  })
}
