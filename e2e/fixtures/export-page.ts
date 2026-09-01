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

  /**
   * Opens the dialog and waits for the frame it is drawn in, not for the generation to finish.
   *
   * By test id, not by text: a block on the canvas can carry the word too — a hero's trust list says
   * "Exports as CSS" — and the role-and-text query then matches the chrome and the document at once.
   */
  async open(): Promise<void> {
    await this.page.getByTestId('export-button').click()
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
   * Opens the dialog once and closes it again, so its chunk is in memory and its component is
   * mounted — ADR-313: the chunk leaves the first load and is prefetched on idle, and from the first
   * open onwards the dialog stays mounted behind a flag.
   *
   * Anything measuring the *cost of the click* has to do this first, or it measures a download.
   */
  async warmUp(): Promise<void> {
    await this.open()
    await this.page.keyboard.press('Escape')
    await expect(this.page.getByTestId('export-dialog')).toBeHidden()
  }

  /**
   * Clicks Export from inside the page and answers after one animation frame, which is what
   * "visible in the frame the button is pressed" means. Playwright's own round trip is not in it.
   *
   * Call `warmUp` first. On a cold page this measures the network — which is a real number about a
   * first click, and not the one the promise in prompt 45 is about.
   */
  openWithinOneFrame(): Promise<{
    readonly visible: boolean
    readonly files: number
    readonly frameMs: number
  }> {
    return this.page.evaluate(async () => {
      const button = document.querySelector<HTMLButtonElement>('[data-testid="export-button"]')

      if (button === null) {
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

  /** How many file rows the tree is showing right now — zero while a run is still printing. */
  fileCount(): Promise<number> {
    return this.page.locator('[data-file-row]').count()
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

  /**
   * The file the viewer is showing, read off the page rather than off the clipboard.
   *
   * Clipboard reads need a permission only Chromium grants under automation, so a spec that runs on
   * three engines asserts on what is on screen. The viewer truncates a very long file and says so —
   * `export-truncated` — which is why this is for looking something up, not for a byte comparison.
   */
  async shownFile(): Promise<string> {
    const viewer = this.page.getByTestId('export-code-viewer')

    await viewer.waitFor()

    return (await viewer.textContent()) ?? ''
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
