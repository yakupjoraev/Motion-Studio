import { type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/** The grid in `responsive-grid`, which is the node the whole spec edits. */
const GRID = '[data-node-id="node_f002"]'

const columns = (page: Page) => page.getByRole('spinbutton', { name: 'Columns' })

const marker = (page: Page) => page.locator('[data-override]')

const switchTo = async (page: Page, breakpoint: string): Promise<void> => {
  await page.getByRole('radiogroup', { name: 'Breakpoint' }).getByRole('radio').nth(0).waitFor()
  await page.locator(`[role="radio"][value="${breakpoint}"]`).click()
}

/** The stepper is a `span[role=spinbutton]` — a scrub field, not an input, so it is driven by keys. */
const setColumns = async (page: Page, target: number): Promise<void> => {
  const field = columns(page)

  await field.focus()

  const current = Number(await field.getAttribute('aria-valuenow'))

  for (let step = 0; step < Math.abs(target - current); step += 1) {
    await field.press(target > current ? 'ArrowUp' : 'ArrowDown')
  }

  await expect(field).toHaveAttribute('aria-valuenow', String(target))
}

const expectColumns = async (page: Page, value: number): Promise<void> => {
  await expect(columns(page)).toHaveAttribute('aria-valuenow', String(value))
}

/**
 * RESPONSIVE_ENGINE.md § Testing, as a flow: the cascade is what a user sees, and the mistake it
 * exists to prevent — an override that looks right in the editor and wrong in the browser — only
 * shows up when the same value is read at more than one breakpoint.
 */
test.describe('editing across breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await page.locator(GRID).click()
    await columns(page).waitFor()
  })

  test('inherits the base value upwards, and marks nothing while it is the base value', async ({
    page,
  }) => {
    await setColumns(page, 1)
    await switchTo(page, 'md')

    await expectColumns(page, 1)
    // RESPONSIVE_ENGINE.md § Editing semantics: the muted dot is for a value inherited from a
    // *smaller breakpoint*; the base value is the one state that carries no marker at all.
    await expect(marker(page)).toHaveCount(0)
    await expect(page.getByTestId('responsive-header')).toContainText('Editing md and up')
  })

  test('writes an override at md and leaves base alone', async ({ page }) => {
    await setColumns(page, 1)
    await switchTo(page, 'md')
    await setColumns(page, 4)

    await expect(marker(page)).toHaveAttribute('data-override', 'overridden')
    await expect(columns(page)).toHaveAccessibleDescription('Overridden at md')

    await switchTo(page, 'lg')

    // Above the override, the same value arrives by cascade and says where it came from.
    await expectColumns(page, 4)
    await expect(marker(page)).toHaveAttribute('data-override', 'inherited')
    await expect(columns(page)).toHaveAccessibleDescription('Inherited from md')

    await switchTo(page, 'base')

    await expectColumns(page, 1)
    await expect(marker(page)).toHaveCount(0)
  })

  test('removes the override key on reset rather than writing the inherited value back', async ({
    page,
  }) => {
    await setColumns(page, 1)
    await switchTo(page, 'md')
    await setColumns(page, 4)

    await page.getByRole('button', { name: 'Reset Columns' }).click()

    // A key set to the base value would still be an override, and would still draw the accent dot —
    // and would emit a dead Tailwind class on export. Its absence is what this asserts.
    await expectColumns(page, 1)
    await expect(marker(page)).toHaveCount(0)
  })

  test('previews each breakpoint at its own frame width', async ({ page }) => {
    const artboard = page.getByTestId('canvas-artboard')

    await expect(artboard).toHaveCSS('width', '375px')

    await switchTo(page, 'lg')

    await expect(artboard).toHaveCSS('width', '1024px')
    await expect(page.getByTestId('breakpoint-label')).toHaveText('lg · 1024')
  })

  test('compares base, md and xl side by side, read-only', async ({ page }) => {
    await page.keyboard.press('Control+Shift+M')

    await expect(page.getByTestId('multi-frame-view')).toBeVisible()

    for (const frame of ['base', 'md', 'xl']) {
      await expect(page.getByTestId(`frame-${frame}`)).toBeVisible()
    }

    // Editing happens in the active frame only, and the caption is what says which one that is.
    await expect(page.getByTestId('frame-base')).toContainText('editing')
    await expect(page.getByTestId('canvas-root')).toHaveCount(0)

    await page.keyboard.press('Control+Shift+M')

    await expect(page.getByTestId('canvas-root')).toBeVisible()
  })
})
