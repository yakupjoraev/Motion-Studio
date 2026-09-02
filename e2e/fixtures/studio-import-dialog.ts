import type { Locator, Page } from '@playwright/test'

/**
 * What the studio says about a file before it opens it — FILE_FORMAT.md § Repair vs reject.
 *
 * The dialog has exactly two outcomes and they are different surfaces: a repaired file reports what
 * was changed and offers `Continue`, a refused one states why and offers the file back. A spec that
 * asked for "the dialog" would not be able to tell the two apart, so this object does not offer one.
 */
export class StudioImportDialog {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** The repairs made on the way in. Absent when the file needed none. */
  report(): Locator {
    return this.page.getByTestId('import-report')
  }

  /** Why the file was refused. Present only when nothing was applied to the document. */
  rejection(): Locator {
    return this.page.getByTestId('import-rejection')
  }

  /** Offered on both outcomes: the bytes the user handed over, unchanged. */
  downloadOriginal(): Locator {
    return this.page.getByRole('button', { name: 'Download original' })
  }

  /** Only ever on the repaired path — its absence is what proves a file was refused. */
  continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' })
  }

  async accept(): Promise<void> {
    await this.continueButton().click()
  }

  async tryAnotherFile(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try another file' }).click()
  }

  /** Closes whatever the dialog is showing without touching the open document. */
  async dismiss(): Promise<void> {
    await this.page.keyboard.press('Escape')
  }
}
