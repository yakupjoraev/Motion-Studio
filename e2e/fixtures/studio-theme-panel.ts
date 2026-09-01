import { type Page, expect } from '@playwright/test'

/** The four discrete scales in `scale-controls`, by the glyph each option is labelled with. */
const RADIUS_LABELS: Readonly<Record<string, string>> = {
  '0': '0',
  '0.5': '½',
  '1': '1',
  '1.5': '1½',
  '2': '2',
}

/**
 * The theme builder, as a spec talks to it — THEME_ENGINE.md § Theme builder UI.
 *
 * Every assertion about a theme goes through a CSS variable rather than through a pixel: the engine's
 * whole claim is that one write recolours the document, and the variable is where that write lands.
 */
export class StudioThemePanel {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async open(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Theme' }).click()
    await this.page.getByTestId('theme-tab').waitFor()
  }

  /** A shipped preset by its id — `data-preset`, which is stable where the visible name is chrome. */
  async choosePreset(presetId: string): Promise<void> {
    const card = this.page.locator(`[data-preset="${presetId}"]`)

    await card.scrollIntoViewIfNeeded()
    await card.click()
    await expect(card).toHaveAttribute('aria-pressed', 'true')
  }

  /**
   * The radius scale. A segmented group is a `radiogroup` of options labelled with fractions, so the
   * caller passes the number and the glyph is looked up here — a spec should not have to know that
   * 1.5 is drawn as `1½`.
   */
  async setRadiusScale(scale: number): Promise<void> {
    const label = RADIUS_LABELS[String(scale)]

    if (label === undefined) {
      throw new Error(`the radius scale has no ${scale} option`)
    }

    await this.setScale('Radius', label)
  }

  /** Any of the four scale rows — Radius, Spacing, Motion, Elevation — by the option's own label. */
  async setScale(row: string, option: string): Promise<void> {
    const group = this.page.getByRole('radiogroup', { name: row })

    await group.scrollIntoViewIfNeeded()

    const choice = group.getByRole('radio', { name: option, exact: true })

    await choice.click()
    await expect(choice).toBeChecked()
  }

  /** The swatch opens a popover; the hex field inside it is the keyboard path and the stable one. */
  async setAccent(hex: string): Promise<void> {
    await this.page.getByRole('button', { name: /^Accent,/ }).click()

    const field = this.page.getByRole('textbox', { name: 'Accent hex' })

    await field.fill(hex)
    await field.press('Enter')
    await this.page.keyboard.press('Escape')
    await expect(field).toBeHidden()
  }

  /** One `--ms-*` variable off the root, which is where the engine resolves a theme to. */
  variable(name: string): Promise<string> {
    return this.page.evaluate(
      (property) => getComputedStyle(document.documentElement).getPropertyValue(property).trim(),
      name,
    )
  }

  /** Every `--ms-*` written on the root, so "the whole theme came back" is assertable, not sampled. */
  variables(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const style = document.documentElement.style
      const result: Record<string, string> = {}

      for (const name of Array.from(style)) {
        if (name.startsWith('--ms-')) {
          result[name] = style.getPropertyValue(name)
        }
      }

      return result
    })
  }
}
