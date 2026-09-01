import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

declare global {
  interface Window {
    /** Set by the init script below, at the first frame the canvas is both painted and live. */
    __interactive?: number
  }
}

/** PERFORMANCE.md § Studio: "time to interactive canvas ≤ 1.2 s on a mid-range laptop". */
const INTERACTIVE_BUDGET_MS = 1200

/** PERFORMANCE.md § Studio: "undo of a 50-node paste ≤ 32 ms" — two frames. */
const UNDO_BUDGET_MS = 32

const PASTE_SIZE = 50

/**
 * Two of the studio's budgets that no other spec measures. Both are timings rather than counts, so
 * both are reported and asserted against the document's own numbers with the run's figures printed.
 */
test.describe('the studio', () => {
  test('paints an interactive canvas inside the budget', async ({ page }, info) => {
    // Both conditions together: nodes on screen says the scene painted, and the store handle says
    // the client bundle ran, so the canvas is live rather than merely visible.
    await page.addInitScript(() => {
      const check = (): void => {
        if (
          document.querySelector('[data-testid="canvas-root"] [data-node-id]') !== null &&
          window.studio !== undefined
        ) {
          window.__interactive = performance.now()

          return
        }

        requestAnimationFrame(check)
      }

      requestAnimationFrame(check)
    })

    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')

    const interactive = await page.evaluate(() => window.__interactive ?? Number.NaN)

    const line = `interactive canvas: ${interactive.toFixed(0)} ms after navigation, 200 nodes`

    info.annotations.push({ type: 'measurement', description: line })
    console.log(`  ${line}`)

    // The claim is that it responds, not only that it painted: a selection made now has to land.
    await studio.selectLayer('node_f004')

    expect(interactive).toBeLessThan(INTERACTIVE_BUDGET_MS)
  })

  test('undoes a 50-node paste inside two frames', async ({ page }, info) => {
    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')

    const result = await page.evaluate(async (target) => {
      const handle = window.studio

      if (handle === undefined) {
        throw new Error('window.studio is absent — the app was built without MS_INSTRUMENT=1')
      }

      const { store } = handle
      const doc = store.getState().document
      const size = (id: string): number =>
        1 + (doc.nodes[id]?.children ?? []).reduce((total, child) => total + size(child), 0)

      const ids: string[] = []
      let copied = 0

      for (const child of doc.nodes[doc.rootId]?.children ?? []) {
        if (copied >= target) {
          break
        }

        ids.push(child)
        copied += size(child)
      }

      await store.getState().copy(ids)

      const paste = await store.getState().paste()

      if (!paste.ok) {
        throw new Error(`the paste was rejected: ${paste.error.message}`)
      }

      const before = Object.keys(store.getState().document.nodes).length
      const start = performance.now()

      store.getState().undo()

      const applied = performance.now() - start
      const painted = await new Promise<number>((resolve) => {
        requestAnimationFrame(() => {
          resolve(performance.now() - start)
        })
      })

      return {
        pasted: paste.value.pasted,
        applied,
        painted,
        after: Object.keys(store.getState().document.nodes).length,
        before,
      }
    }, PASTE_SIZE)

    const line = `undo of a ${result.pasted}-node paste: ${result.applied.toFixed(1)} ms applied, ${result.painted.toFixed(1)} ms to the next frame`

    info.annotations.push({ type: 'measurement', description: line })
    console.log(`  ${line}`)

    expect(result.pasted).toBeGreaterThanOrEqual(PASTE_SIZE)
    expect(result.before - result.after).toBe(result.pasted)
    expect(result.applied).toBeLessThan(UNDO_BUDGET_MS)
  })
})
