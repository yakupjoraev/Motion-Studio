import { expect, test } from '@playwright/test'

/**
 * The first screen swaps a server-rendered frame for a live one — `hero-page-island.tsx`, ADR-295 —
 * and every block inside that frame arrives on its own, behind its own fallback. Each of those swaps
 * is a chance to move the page under it, and the one budget that says so is CLS: 0.02 in
 * `PERFORMANCE.md` § Public pages.
 *
 * Lighthouse asserts the same number nightly. This is here because Lighthouse says *that* the landing
 * shifted, three runs later and in a report; this says which element did it, on the run that did it,
 * in the suite a push waits for.
 */

/** `PERFORMANCE.md` § Public pages. The same figure `lighthouserc.cjs` asserts. */
const CLS_BUDGET = 0.02

test('builds the first screen without moving the page under it', async ({ page, browserName }) => {
  // `layout-shift` is a Chromium entry type; Firefox and WebKit report no shifts at all, so the
  // assertion there would be a green that means nothing.
  test.skip(browserName !== 'chromium', 'layout-shift is reported by Chromium only')

  await page.addInitScript(() => {
    const shifts: { value: number; sources: string[] }[] = []

    // `buffered` so the shifts before this script's own observer existed are counted too.
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number
        hadRecentInput: boolean
        sources: { node?: Element }[]
      })[]) {
        if (entry.hadRecentInput) {
          continue
        }

        shifts.push({
          value: entry.value,
          sources: entry.sources.map((source) => source.node?.className ?? '?'),
        })
      }
    }).observe({ type: 'layout-shift', buffered: true })

    Object.defineProperty(window, 'msShifts', { value: shifts })
  })

  await page.goto('/')

  // The island mounts on idle and each block resolves after it, so the shifts to catch are the ones
  // that happen once everything has arrived — the stage standing complete is the settled state.
  await expect(page.getByRole('button', { name: /Hero block/ })).toBeVisible()
  await page.waitForTimeout(3000)

  const shifts = await page.evaluate(
    () => (window as unknown as { msShifts: { value: number; sources: string[] }[] }).msShifts,
  )
  const total = shifts.reduce((sum, shift) => sum + shift.value, 0)

  // The offenders are printed whatever the verdict: a number with no element beside it is a re-run.
  test.info().annotations.push({
    type: 'layout shifts',
    description: shifts.map((s) => `${s.value.toFixed(4)} — ${s.sources.join(', ')}`).join(' | '),
  })

  expect(total).toBeLessThanOrEqual(CLS_BUDGET)
})
