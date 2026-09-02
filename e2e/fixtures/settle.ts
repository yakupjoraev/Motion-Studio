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

/**
 * "This subtree has stopped moving" — for the scans and the measurements a transition invalidates.
 *
 * A dialog fades and scales in, and a colour read halfway through that is a composite neither state
 * ever has: the docs search scan measured 4.46:1 against a 4.5 threshold once in five runs, on a
 * text colour that passes in both the start state and the end state. Two frames of `settled` are
 * enough for a commit and not for a 150 ms transition.
 *
 * Endless animations are excluded rather than waited for — a spinner or an aurora never finishes,
 * and neither is what a scan is racing.
 */
export async function stillness(page: Page, selector: string): Promise<void> {
  await page.waitForFunction((target) => {
    const root = document.querySelector(target)

    if (root === null) {
      return false
    }

    return root
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY,
      )
      .every((animation) => animation.playState === 'finished' || animation.playState === 'idle')
  }, selector)
}
