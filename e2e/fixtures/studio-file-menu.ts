import type { Page } from '@playwright/test'

import { StudioImportDialog } from './studio-import-dialog'

/**
 * The `File` menu and the two dialogs it opens — PRODUCT.md § 10 and FILE_FORMAT.md § Import.
 *
 * Every entry in that menu is a dialog or a download, so the object is a way in rather than a set of
 * actions: the import's own outcome belongs to `StudioImportDialog`, which is the surface that
 * decides what happens to the file.
 */
export class StudioFileMenu {
  private readonly page: Page

  readonly importDialog: StudioImportDialog

  constructor(page: Page) {
    this.page = page
    this.importDialog = new StudioImportDialog(page)
  }

  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'File' }).click()
  }

  /** One entry by its label, from a closed menu — every caller here starts from one. */
  async choose(item: string): Promise<void> {
    await this.open()
    await this.page.getByRole('menuitem', { name: item }).click()
  }

  /**
   * `File → New`, then one of the shipped templates by its slug.
   *
   * The picker fetches its manifest when it opens (3 kB the first load has no reason to carry), so
   * the card is waited for rather than clicked at whatever is on screen.
   */
  async newFromTemplate(slug: string): Promise<void> {
    await this.choose('New')

    const card = this.page.getByTestId(`template-${slug}`)

    await card.waitFor()
    await card.click()
  }

  /**
   * `File → Import`, with the file handed straight to the input.
   *
   * The dropzone's `Choose a file` opens the OS picker, which Playwright cannot drive; the input
   * behind it is the same element that button clicks, so this is the real path rather than a bypass.
   * Returns the dialog, because what a spec asserts next is always its outcome.
   */
  async importFile(name: string, contents: string): Promise<StudioImportDialog> {
    await this.choose('Import a document')
    await this.page.locator('input[type="file"]').setInputFiles({
      name,
      mimeType: 'application/json',
      buffer: Buffer.from(contents, 'utf8'),
    })

    return this.importDialog
  }
}
