import type { Page } from '@playwright/test'

export interface ScrollOptions {
  /** Milliseconds of scrolling. */
  readonly duration: number
  /** Wheel delta per tick. */
  readonly step?: number
  /** Ticks before the direction flips, so the run stays over the document. */
  readonly reverseAfter?: number
}

export interface ScrollTrace {
  /** Every frame interval observed while scrolling, milliseconds. */
  readonly frames: readonly number[]
  readonly longTasks: readonly number[]
  readonly medianFrameTime: number
  readonly p95FrameTime: number
  readonly worstFrameTime: number
  readonly totalBlockingTime: number
}

interface Collected {
  readonly frames: number[]
  readonly longTasks: number[]
}

declare global {
  interface Window {
    __msTrace?: Collected
    __msStop?: () => void
    __msObservers?: number
  }
}

/**
 * Counts every `IntersectionObserver` the page constructs. Installed before any script runs, which
 * is the only moment the count can be complete — ANIMATION_SYSTEM.md § The scheduler pools them by
 * threshold bucket, and the naive alternative is one per animated node.
 */
export async function countIntersectionObservers(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const Native = window.IntersectionObserver

    window.__msObservers = 0

    class Counted extends Native {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options)
        window.__msObservers = (window.__msObservers ?? 0) + 1
      }
    }

    window.IntersectionObserver = Counted
  })
}

/**
 * Frame intervals and long tasks while the canvas is scrolled, collected in the page.
 *
 * A frame interval is `requestAnimationFrame` to `requestAnimationFrame`: it counts the frames the
 * browser actually produced, which is the number a user feels. `longtask` comes from the browser's
 * own observer rather than from a threshold applied here.
 */
export async function recordScroll(
  page: Page,
  { duration, step = 600, reverseAfter = 12 }: ScrollOptions,
): Promise<ScrollTrace> {
  await page.evaluate(() => {
    const collected: Collected = { frames: [], longTasks: [] }

    window.__msTrace = collected

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        collected.longTasks.push(entry.duration)
      }
    })

    observer.observe({ entryTypes: ['longtask'] })

    let previous = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      collected.frames.push(now - previous)
      previous = now
      frame = requestAnimationFrame(tick)
    })

    window.__msStop = () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  })

  const started = Date.now()

  // The canvas is the scroller, so the wheel goes to its middle rather than to the document.
  const box = await page.locator('[data-testid="canvas-root"]').boundingBox()
  const x = box === null ? 720 : box.x + box.width / 2
  const y = box === null ? 450 : box.y + box.height / 2

  await page.mouse.move(x, y)

  /*
   * Down `reverseAfter` ticks, then back up the same number. The canvas is infinite and the document
   * is not: scrolling one way for five minutes spends four of them measuring an empty artboard,
   * which is a measurement of nothing. Turning around keeps every tick over the real scene.
   */
  let ticks = 0
  let direction = 1

  while (Date.now() - started < duration) {
    await page.mouse.wheel(0, step * direction)
    ticks += 1

    if (ticks % reverseAfter === 0) {
      direction *= -1
    }

    await page.waitForTimeout(50)
  }

  const collected = await page.evaluate(() => {
    window.__msStop?.()

    return window.__msTrace ?? { frames: [], longTasks: [] }
  })

  return summarise(collected)
}

function summarise({ frames, longTasks }: Collected): ScrollTrace {
  // The first interval is measured from before the scroll started, so it times the wait and not a frame.
  const timed = [...frames].slice(1).sort((a, b) => a - b)
  const at = (fraction: number): number =>
    timed.length === 0
      ? 0
      : (timed[Math.min(timed.length - 1, Math.floor(timed.length * fraction))] ?? 0)

  return {
    frames,
    longTasks,
    medianFrameTime: at(0.5),
    p95FrameTime: at(0.95),
    worstFrameTime: timed.at(-1) ?? 0,
    // The Lighthouse definition: how much of each long task ran past 50 ms.
    totalBlockingTime: longTasks.reduce((total, task) => total + Math.max(0, task - 50), 0),
  }
}
