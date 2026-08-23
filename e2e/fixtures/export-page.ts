import { type Locator, type Page, expect } from '@playwright/test'

/**
 * The export dialog, as a spec talks to it — TESTING.md § Page objects. Every selector the six export
 * specs need lives here, so a change in the dialog's chrome costs one file.
 */
export class ExportPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** Opens the dialog and waits for the frame it is drawn in, not for the generation to finish. */
  async open(): Promise<void> {
    await this.page.getByRole('button', { name: /^Export/ }).click()
    await this.page.getByTestId('export-dialog').waitFor()
  }

  /** Everything is scoped to it: the canvas behind the dialog has Copy buttons of its own. */
  dialog(): Locator {
    return this.page.getByRole('dialog')
  }

  status(): Locator {
    return this.page.getByTestId('export-status')
  }

  /** The list is complete before the formatting is, so a wait for it is a wait for the print pass. */
  tree(): Locator {
    return this.page.getByRole('tree', { name: 'Generated files' })
  }

  /**
   * The label, not the input: the radio is `sr-only`, which is the accessible way to draw one and the
   * one thing Playwright will not click. A user clicks the label too.
   */
  async chooseTarget(name: string): Promise<void> {
    await this.dialog().locator('label', { hasText: name }).click()
    await expect(this.page.getByRole('radio', { name: new RegExp(`^${name}`) })).toBeChecked()
  }

  /**
   * Clicks Export from inside the page and answers after one animation frame, which is what
   * "visible in the frame the button is pressed" means. Playwright's own round trip is not in it.
   */
  openWithinOneFrame(): Promise<{
    readonly visible: boolean
    readonly files: number
    readonly frameMs: number
  }> {
    return this.page.evaluate(async () => {
      const button = [...document.querySelectorAll('button')].find((one) =>
        one.textContent?.trimStart().startsWith('Export'),
      )

      if (button === undefined) {
        throw new Error('No Export button')
      }

      const started = performance.now()

      button.click()

      /*
       * One animation frame, because the openness lives in the store: `useSyncExternalStore`
       * schedules the render rather than flushing it inside the click, so the dialog is in the DOM
       * at the next frame and not at the end of the handler. Measured, not assumed.
       */
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

      return {
        visible: document.querySelector('[data-testid="export-dialog"]') !== null,
        files: document.querySelectorAll('[data-file-row]').length,
        frameMs: performance.now() - started,
      }
    })
  }

  async paths(): Promise<string[]> {
    await this.tree().waitFor()

    return this.page
      .locator('[data-file-row]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-file-row') ?? ''))
  }

  /** Waits for the whole run, which is what the status line reports when it stops saying "Generating". */
  async settled(): Promise<void> {
    await expect(this.status()).toContainText('files in', { timeout: 30_000 })
  }

  async selectFile(path: string): Promise<void> {
    await this.page.locator(`[data-file-row="${path}"]`).click()
  }

  async copyShownFile(): Promise<string> {
    await this.dialog().getByRole('button', { name: 'Copy', exact: true }).click()

    return this.clipboard()
  }

  async copyAll(): Promise<string> {
    await this.dialog().getByRole('button', { name: 'Copy all' }).click()

    return this.clipboard()
  }

  /** The number the status line reports for the run that has just finished, in ms. */
  async elapsed(): Promise<number> {
    const text = (await this.status().textContent()) ?? ''

    return Number(/(\d+) ms/.exec(text)?.[1] ?? Number.NaN)
  }

  /** A switch by its label — the panel's rows are `ControlRow`s, not bare inputs. */
  async toggle(label: string): Promise<void> {
    await this.dialog().getByRole('switch', { name: label }).click()
  }

  clipboard(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText())
  }
}
