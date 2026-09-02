import { type Locator, type Page, expect } from '@playwright/test'

/** The four formats of `THEME_ENGINE.md` § Theme in export, by the tab each one is behind. */
const FORMAT_TABS = {
  css: 'CSS variables',
  json: 'JSON',
  tailwind: 'Tailwind config',
  figma: 'Figma Tokens',
} as const

type TokenFormat = keyof typeof FORMAT_TABS

/**
 * The `Export tokens` dialog, as a spec talks to it.
 *
 * The formats are printed from one resolution so they cannot disagree (ADR-171), and that agreement
 * is the only thing worth asserting here — which is why the object hands back a format's text rather
 * than its element.
 */
export class StudioTokenExport {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Export tokens' }).click()
    await this.dialog().getByRole('tab', { name: FORMAT_TABS.css }).waitFor()
  }

  dialog(): Locator {
    return this.page.getByRole('dialog')
  }

  /** One format's output, with its tab brought to the front first. */
  async source(format: TokenFormat): Promise<string> {
    const panel = await this.show(format)

    return (await panel.textContent()) ?? ''
  }

  /**
   * Brings a format to the front and hands back its panel, for the assertions that read better as a
   * `toContainText` on the element than as a comparison on a string.
   */
  async show(format: TokenFormat): Promise<Locator> {
    const panel = this.page.getByTestId(`token-format-${format}`)

    await this.dialog().getByRole('tab', { name: FORMAT_TABS[format] }).click()
    await expect(panel).toBeVisible()

    return panel
  }
}
