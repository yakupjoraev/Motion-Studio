import { expect, test } from '@playwright/test'

import { countIntersectionObservers, recordScroll } from '../fixtures/measure'
import { StudioPage } from '../fixtures/studio-page'

/**
 * The canvas budget itself — PERFORMANCE.md § Budgets: 60 fps with 200 nodes. Same caveat as the
 * other performance specs: the thresholds are deliberately loose, because they are here to catch a
 * change in kind rather than to measure a machine.
 */
test.describe('a 200-node document', () => {
  // The contract's own budget — ENGINEERING_CONTRACT.md § 6, "60 fps with 200 nodes" — and the one
  // assertion here that is strict, because it is the one that describes the product rather than the
  // measuring rig.
  test('holds 60 fps while scrolling', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')

    expect(await studio.nodeCount()).toBe(200)

    const trace = await recordScroll(page, { duration: 5000 })

    expect(trace.medianFrameTime).toBeLessThan(20)
    expect(trace.p95FrameTime).toBeLessThan(20)
    expect(trace.longTasks.length).toBe(0)
  })

  /*
   * The same document on a quarter of a processor. The thresholds come from the measurement of
   * 2026-08-16 (ADR-160): the same fixture with reduced motion — the canvas alone, no entrances —
   * runs at p95 33.3 ms with zero long tasks, and with motion at 66.7 ms with 14. Motion is
   * therefore allowed to cost about as much again as the scene it animates, and no more.
   */
  test('stays within twice the cost of the bare canvas under 4× CPU throttling', async ({
    page,
  }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')
    await studio.throttleCpu(4)

    const trace = await recordScroll(page, { duration: 5000 })

    expect(trace.p95FrameTime).toBeLessThan(90)
    expect(trace.longTasks.length).toBeLessThan(25)
    expect(trace.totalBlockingTime).toBeLessThan(400)
  })

  test('shares one observer bucket set rather than one observer per node', async ({ page }) => {
    const studio = new StudioPage(page)

    await countIntersectionObservers(page)
    await studio.open('stress-200-nodes')

    // The scheduler pools observers by threshold bucket — six buckets, so six at the very most,
    // whatever the node count. The count is taken by wrapping the constructor before the app runs.
    const observers = await page.evaluate(() => window.__msObservers ?? 0)

    expect(observers).toBeLessThanOrEqual(6)
  })
})
