import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/** What the whole spec watches: the accent every theme control eventually moves. */
const ACCENT = '--ms-color-accent'
const RADIUS = '--ms-radius-lg'

/**
 * `THEME_ENGINE.md` § Theme builder UI, as a flow. The thing a unit test cannot show is the one the
 * product is sold on: one control moves, and the document on the canvas changes with it.
 */
test.describe('the theme builder', () => {
  let studio: StudioPage

  test.beforeEach(async ({ page }) => {
    studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.theme.open()
  })

  test('recolours the document from the accent, and one undo puts it back', async () => {
    const before = await studio.theme.variable(ACCENT)

    await studio.theme.setAccent('#12b886')

    await expect.poll(() => studio.theme.variable(ACCENT)).not.toBe(before)

    await studio.undo()

    await expect.poll(() => studio.theme.variable(ACCENT)).toBe(before)
  })

  /**
   * The regression the browser found: the slider is controlled by the document's value and the drag
   * deliberately does not write the document, so without a local draft the thumb was handed its
   * starting value on every frame and a five-second drag committed nothing.
   */
  test('follows a continuous drag and commits once', async () => {
    const slider = studio.theme.slider('Hue shift')

    const committed = await studio.theme.dragSlider('Hue shift', 80, async () => {
      await expect(slider).not.toHaveAttribute('aria-valuenow', '0')
    })

    await studio.undo()

    await expect(slider).toHaveAttribute('aria-valuenow', '0')
    expect(committed).not.toBe('0')
  })

  /**
   * The fixture's four nodes are layout blocks, none of which sets a radius of its own, so the
   * assertion below rests on the token: at scale 0 every radius token is 0 px, and nothing on the
   * canvas is rounded.
   */
  test('squares every block at radius 0', async () => {
    await studio.theme.setRadiusScale(0)

    await expect.poll(() => studio.theme.variable(RADIUS)).toBe('0px')
    expect(await studio.canvas.roundedNodeCount()).toBe(0)
  })

  test('applies a preset and takes the whole theme back in one undo', async () => {
    const before = await studio.theme.variables()

    await studio.theme.choosePreset('brutal')

    await expect.poll(() => studio.theme.variable(RADIUS)).toBe('0px')

    await studio.undo()

    await expect.poll(() => studio.theme.variables()).toEqual(before)
  })

  test('surfaces a contrast repair rather than hiding it', async () => {
    // Deep navy on the dark theme: white text on it measures 1.34:1, so the engine walks the ramp
    // to a step that clears 4.5:1 and reports what it did.
    await studio.theme.setAccent('#1a1f4d')

    await expect(studio.theme.contrast.summary()).toBeVisible()
    await expect(studio.theme.contrast.keepMine()).toBeVisible()

    await studio.theme.contrast.keep()

    await expect(studio.theme.contrast.repairIt()).toBeVisible()
    await expect(studio.theme.tab()).toContainText('1')
  })

  test('exports four formats that agree on the accent', async () => {
    await studio.theme.setAccent('#12b886')
    await studio.theme.tokens.open()

    const css = await studio.theme.tokens.source('css')
    const value = /--ms-color-accent: ([^;]+);/.exec(css)?.[1] ?? ''

    expect(value).not.toBe('')

    await expect(await studio.theme.tokens.show('json')).toContainText(value)
    await expect(await studio.theme.tokens.show('tailwind')).toContainText(
      "'accent': 'var(--ms-color-accent)'",
    )
    await expect(await studio.theme.tokens.show('figma')).toContainText('"$type": "color"')
  })
})
