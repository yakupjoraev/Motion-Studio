import { type Page, expect, test } from '@playwright/test'

import { settled } from '../fixtures/settle'

declare global {
  interface Window {
    /** Written by the init script below: the worst interaction the Event Timing API reported. */
    __inp?: { worst: number; slow: number; first: number }
  }
}

/** PERFORMANCE.md § Public pages: INP ≤ 200 ms. */
const BUDGET_MS = 200

/**
 * The floor the Event Timing API reports at — `durationThreshold` cannot be set below it. A run that
 * reports nothing is therefore a run where every interaction finished inside 16 ms.
 */
const REPORTING_FLOOR_MS = 16

const routes = ['/', '/blocks', '/docs'] as const

/** Installed before any page script so the observer is live for the first interaction. */
const observe = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    window.__inp = { worst: 0, slow: 0, first: -1 }

    new PerformanceObserver((list) => {
      const state = window.__inp

      if (state === undefined) {
        return
      }

      for (const entry of list.getEntries()) {
        state.worst = Math.max(state.worst, entry.duration)
        state.slow += 1
      }
      // `durationThreshold` is Event Timing's, and the DOM lib does not type it on the init
      // dictionary — without it the observer reports at the 104 ms default instead of at 16.
    }).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit)

    new PerformanceObserver((list) => {
      const state = window.__inp

      for (const entry of list.getEntries()) {
        if (state !== undefined && state.first < 0) {
          state.first = entry.duration
        }
      }
    }).observe({ type: 'first-input', buffered: true })
  })
}

/**
 * Every in-page control the route has, driven the way a visitor drives one. Links are left alone: a
 * navigation replaces the document and takes the observer with it.
 */
const interact = async (page: Page): Promise<number> => {
  const buttons = page.locator('button:visible')
  const count = Math.min(await buttons.count(), 8)
  let driven = 0

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index)

    if (!(await button.isEnabled())) {
      continue
    }

    await button.click({ timeout: 5000 })
    driven += 1
    // Whatever the press opened, closed again, so the next press reaches its own control.
    await page.keyboard.press('Escape')
  }

  const fields = page.locator('input[type="search"]:visible, input[type="text"]:visible')

  if ((await fields.count()) > 0) {
    await fields.first().pressSequentially('section', { delay: 40 })
    driven += 'section'.length
  }

  for (let press = 0; press < 10; press += 1) {
    await page.keyboard.press('Tab')
    driven += 1
  }

  return driven
}

/**
 * INP for the three public routes. The number is the worst interaction latency the browser itself
 * reported over a scripted pass through the route's controls — a lab reading of a field metric, which
 * is what a gate can have.
 */
test.describe('the public routes', () => {
  for (const route of routes) {
    test(`respond to input inside the INP budget on ${route}`, async ({ page }, info) => {
      await observe(page)
      await page.goto(route)
      await page.getByRole('heading', { level: 1 }).waitFor()
      // The islands are behind observers; an unwoken island is a control that was never measured.
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await settled(page)
      await page.evaluate(() => {
        window.scrollTo(0, 0)
      })

      /*
       * A control has to exist before a pass over the controls means anything. `first-input` is only
       * reported for an event a handler ran for, so a route whose islands have not mounted yet gives
       * ten tab presses, no entry, and a `first` of -1 — which is what the fixed one-second wait used
       * to hide rather than prevent.
       */
      await page.locator('button:visible').first().waitFor()

      const driven = await interact(page)
      const inp = await page.evaluate(() => window.__inp ?? { worst: 0, slow: 0, first: -1 })
      const worst =
        inp.worst === 0 ? `under ${REPORTING_FLOOR_MS} ms` : `${inp.worst.toFixed(0)} ms`
      const line = `INP ${route}: worst ${worst} over ${driven} interactions, ${inp.slow} event entries above the reporting floor, first input ${inp.first.toFixed(0)} ms`

      info.annotations.push({ type: 'measurement', description: line })
      console.log(`  ${line}`)

      // The first input is always reported, so its presence is what says the observer saw the pass.
      expect(inp.first).toBeGreaterThanOrEqual(0)
      expect(inp.worst).toBeLessThan(BUDGET_MS)
    })
  }
})
