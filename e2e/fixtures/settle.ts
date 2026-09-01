import type { Page } from '@playwright/test'

/**
 * "The page has finished arriving", as an event rather than as a duration — TESTING.md § Determinism:
 * no `waitForTimeout`, wait for a state or an event.
 *
 * Two things have to have happened before a scan or a screenshot means anything, and neither is a
 * number of milliseconds:
 *
 * 1. **The network is quiet.** Every deferred island is a chunk, and a chunk still in flight is a
 *    subtree that is not in the DOM to be scanned. `networkidle` is that, defined by the browser.
 * 2. **React has committed and the browser has painted.** A chunk that arrived during the last
 *    microtask is mounted in the next frame, not in this one — so two frames, which is one to run the
 *    commit and one to be after it.
 *
 * A fixed wait passes on a fast machine and fails on a loaded runner, and it does the same thing
 * whether the page took 40 ms or 4 s. This does neither.
 */
export async function settled(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
      }),
  )
}
