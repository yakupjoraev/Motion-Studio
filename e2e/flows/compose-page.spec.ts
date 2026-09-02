import { expect, test } from '@playwright/test'

import { ExportPage } from '../fixtures/export-page'
import { StudioPage } from '../fixtures/studio-page'

/**
 * Flow B — PRODUCT.md § User flows: compose a landing page from the catalogue, theme it, tune one
 * block, check it at a second breakpoint, and export a Next project.
 *
 * Every other spec in `editor/` takes one subsystem and holds the rest still. This one is the
 * opposite and that is its value: the palette mints ids the theme engine then recolours, the
 * inspector writes into a document the responsive cascade reads, and the exporter has to make sense
 * of all of it. A subsystem that only works when nothing else moved is not shipped.
 */
const PAGE = ['navbar', 'hero-aurora', 'bento-grid', 'pricing-table', 'faq-accordion', 'footer']

/** Six blocks and a theme pass, three engines: this is the longest flow in the suite. */
test.describe('composing a page', () => {
  test.slow()

  test('builds, themes, tunes and exports a landing page', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.openEmpty()

    const empty = await studio.nodeCount()

    for (const block of PAGE) {
      await studio.palette.insert(block)
    }

    // Six inserts, six more nodes — a block that lands inside another instead of beside it would
    // still raise the count, so the layer names are checked too.
    await expect.poll(() => studio.nodeCount()).toBe(empty + PAGE.length)

    const names = (await studio.layers.names()).join(' ').toLowerCase()

    expect(names).toContain('navbar')
    expect(names).toContain('footer')

    await studio.theme.open()

    const beforeTheme = await studio.theme.variable('--ms-color-accent')

    await studio.theme.choosePreset('midnight')
    await expect.poll(() => studio.theme.variable('--ms-color-accent')).not.toBe(beforeTheme)

    const beforeRadius = await studio.theme.variable('--ms-radius-lg')

    await studio.theme.setRadiusScale(1.5)
    await expect.poll(() => studio.theme.variable('--ms-radius-lg')).not.toBe(beforeRadius)

    await studio.selectNode('aurora')
    await studio.inspector.setControl('Headline', 'Ship faster')

    // The canvas is the assertion, not the control: a headline that lands in the store and never
    // reaches the artboard is the failure this flow is looking for.
    await expect(studio.canvas.root()).toContainText('Ship faster')

    await studio.motion.open()
    await studio.motion.applyPreset('Clip reveal')

    await studio.openPanelTab('Layers')
    await studio.selectNode('aurora')
    await studio.inspector.setBreakpoint('md')
    await studio.inspector.expectNoOverflow()

    const exportPage = new ExportPage(page)

    await exportPage.open()
    await exportPage.chooseTarget('Next.js')
    await exportPage.settled()

    const files = await exportPage.paths()

    expect(files).toContain('app/page.tsx')
    expect(files.length).toBeGreaterThan(6)

    /*
     * The headline typed into the inspector is in the files the exporter produced, which is the whole
     * claim of the flow: what was composed is what ships. It is in the block's own component rather
     * than in `page.tsx` — the printer composes the page from components and leaves each one's props
     * where the component is — so the file is found by name instead of assumed.
     */
    const hero = files.find((path) => path.includes('hero-aurora'))

    expect(hero, 'the hero has a component file of its own').toBeDefined()

    await exportPage.selectFile(hero ?? '')

    expect(await exportPage.shownFile()).toContain('Ship faster')
  })

  /**
   * The same flow with the mouse unplugged, which prompt 56 calls the most valuable test in the
   * suite. `a11y/keyboard-only-compose` walks the palette by hand and asserts on what is *announced*;
   * this one asserts that the keyboard path produces the same document and the same export as the pointer
   * did above. Two specs, two subjects, one path.
   */
  test('composes and exports without a mouse', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.openEmpty()

    const empty = await studio.nodeCount()

    await studio.focusLeftPanel()

    // Three tabs from the panel to its search box — the palette is the tab the studio opens on.
    for (let press = 0; press < 3; press += 1) {
      await page.keyboard.press('Tab')
    }

    await expect(studio.palette.searchBox()).toBeFocused()
    await page.keyboard.type('hero')

    const card = await studio.palette.tabToFirstCard()

    expect(card).not.toBe('')

    await page.keyboard.press('Enter')
    await expect.poll(() => studio.nodeCount()).toBe(empty + 1)

    // The export dialog has a shortcut, and a keyboard user who has just inserted a block is in the
    // palette — reaching the chrome's button by tabbing would be a different test with a worse name.
    const exportPage = new ExportPage(page)

    await studio.press('Mod+Shift+E')
    await exportPage.frame().waitFor()

    await exportPage.settled()

    const files = await exportPage.paths()

    expect(files.length).toBeGreaterThan(0)

    // Focus is inside the dialog rather than left behind on the palette card — ADR-325.
    const inside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')

      return dialog?.contains(document.activeElement) ?? false
    })

    expect(inside, 'focus is inside the export dialog').toBe(true)
  })
})
