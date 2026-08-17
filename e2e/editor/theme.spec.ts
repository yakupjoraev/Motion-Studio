import { type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/** What the whole spec watches: the accent every theme control eventually moves. */
const accent = (page: Page): Promise<string> =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ms-color-accent').trim(),
  )

const radius = (page: Page): Promise<string> =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ms-radius-lg').trim(),
  )

/** Every `--ms-*` on the root, so "the whole theme came back" can be asserted rather than sampled. */
const variables = (page: Page): Promise<Record<string, string>> =>
  page.evaluate(() => {
    const style = document.documentElement.style
    const result: Record<string, string> = {}

    for (const name of Array.from(style)) {
      if (name.startsWith('--ms-')) {
        result[name] = style.getPropertyValue(name)
      }
    }

    return result
  })

const openThemeTab = async (page: Page): Promise<void> => {
  await page.getByRole('tab', { name: 'Theme' }).click()
  await page.getByTestId('theme-tab').waitFor()
}

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
 * `THEME_ENGINE.md` § Theme builder UI, as a flow. The thing a unit test cannot show is the one the
 * product is sold on: one control moves, and the document on the canvas changes with it.
 */
test.describe('the theme builder', () => {
  test.beforeEach(async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await openThemeTab(page)
  })

  test('recolours the document from the accent, and one undo puts it back', async ({ page }) => {
    const before = await accent(page)

    await setAccent(page, '#12b886')

    await expect.poll(() => accent(page)).not.toBe(before)

    await page.keyboard.press('ControlOrMeta+z')

    await expect.poll(() => accent(page)).toBe(before)
  })

  /**
   * The regression the browser found: the slider is controlled by the document's value and the drag
   * deliberately does not write the document, so without a local draft the thumb was handed its
   * starting value on every frame and a five-second drag committed nothing.
   */
  test('follows a continuous drag and commits once', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Hue shift' })

    // The panel scrolls, and a box read before the control is on screen points at empty chrome.
    await slider.scrollIntoViewIfNeeded()

    const box = await slider.boundingBox()

    if (box === null) {
      throw new Error('the hue slider has no box')
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()

    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 20 })

    await expect(slider).not.toHaveAttribute('aria-valuenow', '0')

    await page.mouse.up()

    const committed = await slider.getAttribute('aria-valuenow')

    await page.keyboard.press('ControlOrMeta+z')

    await expect(slider).toHaveAttribute('aria-valuenow', '0')
    expect(committed).not.toBe('0')
  })

  /**
   * The fixture's four nodes are layout blocks, none of which sets a radius of its own, so the
   * assertion below rests on the token: at scale 0 every radius token is 0 px, and nothing on the
   * canvas is rounded.
   */
  test('squares every block at radius 0', async ({ page }) => {
    await page.getByRole('radiogroup', { name: 'Radius' }).getByRole('radio', { name: '0' }).click()

    await expect.poll(() => radius(page)).toBe('0px')

    const rounded = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('[data-node-id]')).filter((node) => {
          const value = getComputedStyle(node).borderRadius

          return value !== '' && value !== '0px'
        }).length,
    )

    expect(rounded).toBe(0)
  })

  test('applies a preset and takes the whole theme back in one undo', async ({ page }) => {
    const before = await variables(page)

    await page.getByTestId('theme-presets').getByRole('button', { name: 'Brutal' }).click()

    await expect.poll(() => radius(page)).toBe('0px')

    await page.keyboard.press('ControlOrMeta+z')

    await expect.poll(() => variables(page)).toEqual(before)
  })

  test('surfaces a contrast repair rather than hiding it', async ({ page }) => {
    // Deep navy on the dark theme: white text on it measures 1.34:1, so the engine walks the ramp
    // to a step that clears 4.5:1 and reports what it did.
    await setAccent(page, '#1a1f4d')

    await expect(page.getByText(/contrast repair/).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Keep mine' })).toBeVisible()

    await page.getByRole('button', { name: 'Keep mine' }).click()

    await expect(page.getByRole('button', { name: 'Repair it' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Theme' })).toContainText('1')
  })

  test('exports four formats that agree on the accent', async ({ page }) => {
    await setAccent(page, '#12b886')
    await page.getByRole('button', { name: 'Export tokens' }).click()

    const dialog = page.getByRole('dialog')

    await expect(dialog.getByRole('tab', { name: 'CSS variables' })).toBeVisible()

    const css = await dialog.getByTestId('token-format-css').textContent()
    const value = /--ms-color-accent: ([^;]+);/.exec(css ?? '')?.[1] ?? ''

    expect(value).not.toBe('')

    await dialog.getByRole('tab', { name: 'JSON' }).click()
    await expect(dialog.getByTestId('token-format-json')).toContainText(value)

    await dialog.getByRole('tab', { name: 'Tailwind config' }).click()
    await expect(dialog.getByTestId('token-format-tailwind')).toContainText(
      "'accent': 'var(--ms-color-accent)'",
    )

    await dialog.getByRole('tab', { name: 'Figma Tokens' }).click()
    await expect(dialog.getByTestId('token-format-figma')).toContainText('"$type": "color"')
  })
})
