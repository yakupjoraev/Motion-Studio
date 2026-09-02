import { type Locator, type Page, type Response, expect } from '@playwright/test'

/**
 * The public catalogue and one block's detail page — `prompts/52`, PRODUCT.md § User flows A.
 *
 * The two are one object because the flow crosses between them: a developer arrives at `/blocks`,
 * opens a block, tunes it and copies the code. Which of the two a method belongs to is stated by
 * what it needs — `blockIds` reads the index, everything else reads a detail page.
 */
export class GalleryPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async openCatalogue(): Promise<void> {
    await this.page.goto('/blocks')
  }

  /**
   * One block's page, optionally with the query a tuned block carries in its URL. Answers with the
   * navigation's response, which is what the catalogue-wide sweep asserts a status off.
   */
  openBlock(blockId: string, query = ''): Promise<Response | null> {
    return this.page.goto(`/blocks/${blockId}${query}`)
  }

  /**
   * Every block the catalogue offers, read off the index rather than imported from the registry.
   *
   * Reading the page proves something an import could not: that the list and the detail pages agree
   * about what exists. A card whose page 404s fails on that, and so does a page with no card.
   */
  blockIds(): Promise<string[]> {
    return this.page.$$eval('[data-block-card]', (cards) =>
      cards.map((card) => card.getAttribute('data-block-card') ?? ''),
    )
  }

  /** The block itself, rendered live — the thing the page exists to show. */
  previewStage(): Locator {
    return this.page.getByTestId('block-preview-stage')
  }

  /** The panel of generated controls beside the preview. */
  controls(): Locator {
    return this.page.getByTestId('block-controls')
  }

  /** The page's own `h1`, scoped to the header: a preview brings the block's headings with it. */
  heading(): Locator {
    return this.page.locator('main > header').getByRole('heading', { level: 1 })
  }

  source(): Locator {
    return this.page.getByTestId('block-source')
  }

  /** What a screen reader is told when the picture changes — the only signal it gets. */
  announcer(): Locator {
    return this.page.getByTestId('preview-announcer')
  }

  /** The quiet note about a URL parameter the block could not take. */
  rejectedParams(): Locator {
    return this.page.getByTestId('rejected-params')
  }

  copyReact(): Locator {
    return this.page.getByTestId('copy-react').first()
  }

  /** Any live region on the page, for the copy that answers in words rather than in the button. */
  liveRegion(): Locator {
    return this.page.locator('[aria-live="polite"]').first()
  }

  slider(name: RegExp | string): Locator {
    return this.controls().getByRole('slider', { name })
  }

  /** Steps a slider with the keyboard, which is the path that works on every engine. */
  async stepSlider(name: RegExp | string, presses: number, key: string): Promise<void> {
    await this.slider(name).focus()

    for (let press = 0; press < presses; press += 1) {
      await this.page.keyboard.press(key)
    }
  }

  select(name: RegExp | string): Locator {
    return this.controls().getByRole('combobox', { name })
  }

  /** The studio's own select, which is a Radix combobox and not a `<select>`. */
  async chooseOption(name: RegExp | string, option: string): Promise<void> {
    await this.select(name).click()
    await this.page.getByRole('option', { name: option }).click()
    await expect(this.select(name)).toContainText(option)
  }

  /** The preview's theme switch — a radio group above the stage. */
  async setPreviewTheme(name: RegExp | string): Promise<void> {
    await this.page.getByRole('radio', { name }).click()
  }
}
