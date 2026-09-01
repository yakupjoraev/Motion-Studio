import AxeBuilder from '@axe-core/playwright'
import { type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

import { settled } from '../fixtures/settle'

/**
 * ACCESSIBILITY.md § Testing: zero violations on every route, **in both colour modes**. The existing
 * route specs check each surface in the states that surface has; this one is the sweep, and the
 * second mode is the half nothing checked before — the palettes are different colours and contrast
 * is a per-mode measurement.
 */
const scan = async (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

/** The mode script reads storage before first paint, so the choice has to be there before the load. */
const withMode = async (page: Page, mode: 'light' | 'dark'): Promise<void> => {
  await page.addInitScript((stored) => {
    localStorage.setItem('ms-color-mode', stored)
  }, mode)
}

/** The theme is on the root before anything is scanned: a contrast check reads resolved colours. */
const themed = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-theme-ready'))
  await settled(page)
}

const ROUTES = [
  { path: '/', ready: 'heading' },
  { path: '/blocks', ready: 'heading' },
  { path: '/blocks/hero-centered', ready: 'controls' },
  { path: '/docs', ready: 'heading' },
  { path: '/docs/accessibility', ready: 'heading' },
  { path: '/playground', ready: 'heading' },
] as const

for (const mode of ['dark', 'light'] as const) {
  test.describe(`every route in ${mode} mode`, () => {
    for (const route of ROUTES) {
      test(`has no axe violations on ${route.path}`, async ({ page }) => {
        await withMode(page, mode)
        await page.goto(route.path)

        if (route.ready === 'controls') {
          await page.getByTestId('block-controls').waitFor()
        } else {
          await page.getByRole('heading', { level: 1 }).waitFor()
        }

        await themed(page)
        // The mode under test is the mode the page ended in, not the one that was asked for.
        await expect(page.locator('html')).toHaveAttribute('data-color-mode', mode)

        expect((await scan(page)).violations).toEqual([])
      })
    }

    test('has no axe violations in the studio', async ({ page }) => {
      await withMode(page, mode)

      const studio = new StudioPage(page)

      await studio.open('responsive-grid')
      await themed(page)

      expect((await scan(page)).violations).toEqual([])
    })
  })
}
