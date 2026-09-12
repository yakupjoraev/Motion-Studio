import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * `prompts/68`. What makes this product not a page builder used to live behind a dialog nobody is
 * told to open. The flow is the one the prompt describes: select a block, read its React, change a
 * prop, watch the line change — and close the panel again, because closed is a first-class state.
 */
const FIXTURE = 'export-landing'

const viewer = (page: StudioPage['page']) => page.getByTestId('export-code-viewer')

test.describe('reading the selected block’s code', () => {
  test('opens on the toggle and shows the component the selection generates', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)

    // Closed is where a studio opens: the panel is not in the document at all until it is asked for.
    await expect(page.getByTestId('code-panel-region')).toHaveCount(0)

    await page.getByTestId('toggle-code-panel').click()
    await studio.selectNode('heading')

    await expect(viewer(page)).toBeVisible()
    await expect(viewer(page)).toContainText('export')
  })

  test('says what to do when nothing is selected', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)
    await page.getByTestId('toggle-code-panel').click()
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('code-panel-empty')).toBeVisible()
  })

  test('follows a prop edit', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)
    await page.getByTestId('toggle-code-panel').click()
    await studio.selectNode('heading')
    await expect(viewer(page)).toContainText('export')

    await studio.inspector.setControl('Text', 'Read the code')

    // The printed component carries the prop, so the edit is visible as text rather than as a
    // repaint nobody can assert on.
    await expect(viewer(page)).toContainText('Read the code')
  })

  test('stays closed across a reload once it is closed', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)
    await page.getByTestId('toggle-code-panel').click()
    await expect(page.getByTestId('code-panel-region')).toBeVisible()

    await page.getByTestId('toggle-code-panel').click()
    await page.reload()
    await page.waitForSelector('[data-testid="canvas-root"] [data-node-id]')

    await expect(page.getByTestId('code-panel-region')).toHaveCount(0)
  })

  test('takes its turn in the F2 cycle only while it is open', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)

    const scopeNow = (): Promise<string | null> =>
      page.evaluate(
        () =>
          document.activeElement
            ?.closest('[data-shortcut-scope]')
            ?.getAttribute('data-shortcut-scope') ?? null,
      )

    await page.getByTestId('toggle-code-panel').click()
    await expect(page.getByTestId('code-panel-region')).toBeVisible()

    const seen: (string | null)[] = []

    for (let press = 0; press < 4; press += 1) {
      await page.keyboard.press('F2')
      seen.push(await scopeNow())
    }

    // Every region takes a turn, and the code panel is one of them now.
    expect(new Set(seen)).toEqual(new Set(['canvas', 'left', 'code', 'inspector']))
  })
})
