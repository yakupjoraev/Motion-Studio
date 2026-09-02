import { type TestInfo, expect, test } from '@playwright/test'

import { type ScrollTrace, traceWhile } from '../fixtures/measure'
import { StudioPage } from '../fixtures/studio-page'

/** A heading in the first section dropped onto a text node in the second — a legal reparent. */
const DRAGGED = 'node_f004'
const ONTO = 'node_f015'

/** ENGINEERING_CONTRACT.md § 6 — 60 fps with 200 nodes — with one frame of slack. */
const BUDGET_P95_MS = 20

/*
 * The 4× thresholds are deliberately loose and meant to stay loose. At a quarter of a processor the
 * scene rasterizes over the frame budget by definition, so what is left to catch is a regression of
 * *kind* — a gesture gone through React, a per-node listener, a layout read in a loop — which lands
 * an order of magnitude past these numbers. The exact guard is the render count each full-speed test
 * asserts; this test is the coarse one.
 *
 * Calibrated against seven consecutive runs on one machine, whose spread is what the looseness is
 * for: p95 33–100 ms, 0–30 long tasks, 0–774 ms blocking. Thresholds inside that spread — the first
 * draft's 80 ms, 10 tasks and 300 ms — failed on two runs in a row, on a different gesture each time.
 * Do not tighten them to a measurement again.
 */
const THROTTLED_P95_MS = 150
const THROTTLED_LONG_TASKS = 40
const THROTTLED_BLOCKING_MS = 1500

const report = (info: TestInfo, gesture: string, trace: ScrollTrace): void => {
  const line = `${gesture}: median ${trace.medianFrameTime.toFixed(1)} ms, p95 ${trace.p95FrameTime.toFixed(1)} ms, worst ${trace.worstFrameTime.toFixed(1)} ms, ${trace.longTasks.length} long tasks, ${trace.totalBlockingTime.toFixed(0)} ms blocking`

  info.annotations.push({ type: 'measurement', description: line })
  // Printed as well as annotated: the `list` reporter does not print annotations.
  console.log(`  ${line}`)
}

const expectThrottled = (trace: ScrollTrace): void => {
  expect(trace.p95FrameTime).toBeLessThan(THROTTLED_P95_MS)
  expect(trace.longTasks.length).toBeLessThan(THROTTLED_LONG_TASKS)
  expect(trace.totalBlockingTime).toBeLessThan(THROTTLED_BLOCKING_MS)
}

/**
 * The four canvas gestures over 200 nodes, measured at full speed against the contract's budget and
 * again at a quarter of a processor. The render counts are the assertions that travel between
 * machines — PERFORMANCE.md § Rendering.
 */
test.describe('a 200-node document', () => {
  test.beforeEach(async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')

    expect(await studio.nodeCount()).toBe(200)
  })

  test('pans at 60 fps without re-rendering the canvas', async ({ page }, info) => {
    const studio = new StudioPage(page)
    const before = await studio.renderCount('canvas-root')

    const trace = await traceWhile(page, async () => {
      for (let sweep = 0; sweep < 6; sweep += 1) {
        const away = sweep % 2 === 0

        await studio.pan({ dx: away ? 160 : -160, dy: away ? 120 : -120 })
      }
    })

    report(info, 'pan', trace)

    expect(trace.p95FrameTime).toBeLessThan(BUDGET_P95_MS)
    expect(await studio.renderCount('canvas-root')).toBe(before)
  })

  test('zooms at 60 fps without re-rendering the canvas', async ({ page }, info) => {
    const studio = new StudioPage(page)
    const before = await studio.renderCount('canvas-root')

    const trace = await traceWhile(page, async () => {
      await studio.zoom({ ticks: 10 })
      await studio.zoom({ ticks: -10 })
    })

    report(info, 'zoom', trace)

    expect(trace.p95FrameTime).toBeLessThan(BUDGET_P95_MS)
    expect(await studio.renderCount('canvas-root')).toBe(before)
  })

  test('sweeps a marquee at 60 fps', async ({ page }, info) => {
    const studio = new StudioPage(page)

    const trace = await traceWhile(page, async () => {
      await studio.marquee({ dx: -700, dy: 700 })
    })

    report(info, 'marquee', trace)

    expect(trace.p95FrameTime).toBeLessThan(BUDGET_P95_MS)
  })

  test('drags a node at 60 fps', async ({ page }, info) => {
    const studio = new StudioPage(page)

    await studio.openPanelTab('Layers')

    const trace = await traceWhile(page, async () => {
      await studio.layers.drag(DRAGGED, ONTO)
    })

    report(info, 'drag', trace)

    expect(trace.p95FrameTime).toBeLessThan(BUDGET_P95_MS)
  })

  test('holds every gesture together under 4× CPU throttling', async ({ page }, info) => {
    const studio = new StudioPage(page)

    await studio.throttleCpu(4)

    const pan = await traceWhile(page, async () => {
      await studio.pan({ dx: 160, dy: 120 })
      await studio.pan({ dx: -160, dy: -120 })
    })
    const zoom = await traceWhile(page, async () => {
      await studio.zoom({ ticks: 8 })
      await studio.zoom({ ticks: -8 })
    })
    const marquee = await traceWhile(page, async () => {
      await studio.marquee({ dx: -700, dy: 700 })
    })

    await studio.openPanelTab('Layers')

    const drag = await traceWhile(page, async () => {
      await studio.layers.drag(DRAGGED, ONTO)
    })

    report(info, 'pan, 4×', pan)
    report(info, 'zoom, 4×', zoom)
    report(info, 'marquee, 4×', marquee)
    report(info, 'drag, 4×', drag)

    for (const trace of [pan, zoom, marquee, drag]) {
      expectThrottled(trace)
    }
  })
})
