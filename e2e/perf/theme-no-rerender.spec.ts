import { type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

const accent = (page: Page): Promise<string> =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ms-color-accent').trim(),
  )

/** The swatch opens the picker in a popover; the hex field inside it is the keyboard path. */
const setAccent = async (page: Page, hex: string): Promise<void> => {
  await page.getByRole('button', { name: /^Accent,/ }).click()

  const field = page.getByRole('textbox', { name: 'Accent hex' })

  await field.fill(hex)
  await field.press('Enter')
  await page.keyboard.press('Escape')
  await expect(field).toBeHidden()
}

/**
 * PERFORMANCE.md § Studio: a theme switch is "zero React re-renders", which is a claim about the
 * whole editor — so the canvas and the chrome are both counted (THEME_ENGINE.md § Runtime).
 */
test.describe('a theme change', () => {
  test('recolours the document without re-rendering the canvas or the chrome', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('stress-200-nodes')
    await page.getByRole('tab', { name: 'Theme' }).click()
    await page.getByTestId('theme-tab').waitFor()

    const before = await accent(page)
    const canvasBefore = await studio.renderCount('canvas-root')
    const shellBefore = await studio.renderCount('studio-shell')

    await setAccent(page, '#12b886')

    await expect.poll(() => accent(page)).not.toBe(before)

    expect(await studio.renderCount('canvas-root')).toBe(canvasBefore)
    expect(await studio.renderCount('studio-shell')).toBe(shellBefore)
  })
})
