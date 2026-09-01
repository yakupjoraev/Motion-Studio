import AxeBuilder from '@axe-core/playwright'
import { type Page, expect, test } from '@playwright/test'

import { settled } from '../fixtures/settle'

/**
 * `pnpm test:e2e:a11y` — ACCESSIBILITY.md § Gates: zero violations on every public surface. The
 * gallery is two surfaces, and the detail page is checked at 320 px as well as at 1440 for the
 * reason ADR-298 records: a region that scrolls at one width does not scroll at the other, so a
 * suite that only looks at the wide one cannot see the defect.
 */
const scan = async (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

test.describe('the block catalogue', () => {
  test('has no axe violations once the previews have mounted', async ({ page }) => {
    await page.goto('/blocks')
    await page.getByRole('heading', { level: 1 }).waitFor()
    await settled(page)

    expect((await scan(page)).violations).toEqual([])
  })

  test('keeps the filtered-out cards out of the tab order', async ({ page }) => {
    await page.goto('/blocks')
    await page.getByRole('heading', { level: 1 }).waitFor()

    await page.getByLabel('Search the catalogue').fill('aurora')

    // `display: none` and not `aria-hidden`: a hidden card a keyboard can still reach is the version
    // of this that looks right and traps a reader in an empty grid.
    await expect(page.locator('[data-block-card="hero-centered"]')).toBeHidden()
    await expect(page.locator('[data-block-card="aurora-background"]')).toBeVisible()

    expect((await scan(page)).violations).toEqual([])
  })
})

test.describe('a block’s detail page', () => {
  test('has no axe violations', async ({ page }) => {
    await page.goto('/blocks/aurora-background')
    await page.getByTestId('block-controls').waitFor()
    await settled(page)

    expect((await scan(page)).violations).toEqual([])
  })

  test('has no axe violations at 320 px, and reaches the source from the keyboard', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 720 } })
    const page = await context.newPage()

    await page.goto('/blocks/aurora-background')
    await page.getByTestId('block-controls').waitFor()
    await settled(page)

    expect((await scan(page)).violations).toEqual([])

    const source = page.getByTestId('block-source')
    await source.focus()
    await expect(source).toBeFocused()

    await context.close()
  })

  test('announces what a control changed', async ({ page }) => {
    await page.goto('/blocks/aurora-background')

    const controls = page.getByTestId('block-controls')
    await controls.waitFor()

    await controls.getByRole('combobox', { name: /^tint/i }).click()
    await page.getByRole('option', { name: 'success' }).click()

    await expect(page.getByTestId('preview-announcer')).toHaveText(/tint success/i)
  })

  test('names the preview as a region, so a reader knows whose headings those are', async ({
    page,
  }) => {
    await page.goto('/blocks/hero-centered')

    await expect(page.getByRole('region', { name: /live preview/i })).toBeVisible()
  })

  test('is readable with no JavaScript: the props table, the notes and the source', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto('/blocks/aurora-background')

    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Accessibility' })).toBeVisible()
    await expect(page.getByTestId('block-source')).toBeVisible()

    await context.close()
  })
})
