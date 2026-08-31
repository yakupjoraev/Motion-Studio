/*
 * jsdom implements no `indexedDB`, and the persistence layer is the one subsystem whose failure mode
 * is losing the user's work — ADR-282. This installs the reference implementation as a global for
 * every test file in this app; the real engine is exercised by `e2e/editor/persistence.spec.ts`.
 */
import 'fake-indexeddb/auto'

import { configure } from '@testing-library/react'

/*
 * jsdom 25 implements `Blob` without `text()`, which every browser has had since 2019 and which the
 * import path uses to read a chosen file. The shim is the spec's own definition — read the blob,
 * decode it as UTF-8 — and it exists because the alternative is writing `FileReader` callbacks in
 * production code to satisfy a test environment.
 */
if (typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function text(this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}

/**
 * The inspector is code-split — its body and its controls are chunks, so every query for a control
 * waits for a dynamic import to resolve. One second is Testing Library's default and it is enough on
 * a warm laptop and not on a cold CI runner, which is what turned three passing tests red.
 *
 * Five seconds is a timeout, not a sleep: a test that finds its element in 40 ms still takes 40 ms.
 */
configure({ asyncUtilTimeout: 5000 })

/*
 * ADR-312 put the block definitions on a chunk the studio requests after it paints, so the store's
 * registry starts empty. A unit test measures behaviour rather than bytes, and its studio needs a
 * catalogue: this is the real one, injected once for every file in this app.
 */
import { blockRegistry } from '@motion-studio/blocks/registry'

import { primeBlockRegistry } from '../store/block-registry'

primeBlockRegistry(blockRegistry)
