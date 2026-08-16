import { type CDPSession, expect, test } from '@playwright/test'

import { recordScroll } from '../fixtures/measure'
import { StudioPage } from '../fixtures/studio-page'

/**
 * Frame timings on CI hardware are noisy, so every threshold here is generous on purpose: these
 * specs exist to catch a **regression of kind** — an animation that started triggering layout, a
 * component that stopped going through the scheduler — not to police milliseconds. Tightening them
 * turns a useful signal into a flaky one.
 */
test.describe('a motion-heavy document', () => {
  test('holds 60 fps while scrolling', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-motion-heavy')

    const trace = await recordScroll(page, { duration: 5000 })

    expect(trace.frames.length).toBeGreaterThan(30)
    expect(trace.medianFrameTime).toBeLessThan(20)
    expect(trace.p95FrameTime).toBeLessThan(20)
    expect(trace.longTasks.length).toBe(0)
  })

  // Measured 2026-08-16 at p95 50 ms with 12 long tasks (ADR-160). The threshold is loose on
  // purpose: what it catches is an animation that starts triggering layout, not a slow machine.
  test('degrades predictably under 4× CPU throttling', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-motion-heavy')
    await studio.throttleCpu(4)

    const trace = await recordScroll(page, { duration: 5000 })

    expect(trace.p95FrameTime).toBeLessThan(90)
    expect(trace.longTasks.length).toBeLessThan(25)
  })

  test('shares one scroll listener and one pointer listener across every node', async ({
    page,
  }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-motion-heavy')

    const listeners = await studio.listenerCounts()

    // ANIMATION_SYSTEM.md § The scheduler: one bus each, however many presets subscribe.
    expect(listeners['scroll'] ?? 0).toBeLessThanOrEqual(1)
    expect(listeners['pointermove'] ?? 0).toBeLessThanOrEqual(1)
    expect(listeners['resize'] ?? 0).toBeLessThanOrEqual(1)
  })

  test('costs almost nothing while the tab is hidden', async ({ page, context }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-motion-heavy')

    const client = await context.newCDPSession(page)

    await client.send('Performance.enable')

    // A headless browser has no tab to switch away from, so the state is overridden and the event
    // dispatched — which is exactly the pair the scheduler listens for. What is under test is our
    // `visibilitychange` handler, not Chrome's.
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    const before = await taskDuration(client)

    await page.waitForTimeout(3000)

    const after = await taskDuration(client)

    expect(await page.evaluate(() => document.visibilityState)).toBe('hidden')
    // Three seconds of wall clock. A frame loop still running would spend hundreds of milliseconds.
    expect(after - before).toBeLessThan(0.3)
  })
})

/** Seconds of main-thread work the renderer has done, as the browser counts it. */
const taskDuration = async (client: CDPSession): Promise<number> => {
  const { metrics } = await client.send('Performance.getMetrics')

  return metrics.find((metric) => metric.name === 'TaskDuration')?.value ?? 0
}
