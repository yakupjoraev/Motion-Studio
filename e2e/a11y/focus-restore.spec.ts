import { type Locator, type Page, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * ACCESSIBILITY.md § Dialogs: "focus is trapped and restored to the trigger on close". Every dialog
 * the studio has, opened from the control a person would use and closed with `Esc` — a restored focus
 * is the difference between closing a dialog and being dropped at the top of the document.
 */
const DIALOGS = [
  { item: 'New', title: 'New document' },
  { item: 'Open', title: 'Documents' },
  { item: 'Save as', title: 'Save as' },
  { item: 'Import a document', title: 'Import a document' },
  { item: 'Version history', title: 'Version history' },
] as const

/**
 * The window every focus reading in this file is given.
 *
 * The restore itself is synchronous — `Dialog`'s `onCloseAutoFocus` calls `focus()` on the control it
 * recorded — and it was verified on WebKit to land within 3 s of the close, twice in a row. What
 * needs the room is the *reading*: a single locator read on this machine's WebKit has been measured
 * at 3.3 s under load, so a 5 s budget buys one or two polls and fails a restore that worked. The
 * same two tests were the `2 flaky` line CI printed and nobody read.
 */
const RESTORE_MS = 15_000

/** What the accessibility tree would call the focused element, for a failure message worth reading. */
const focusedName = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const element = document.activeElement

    if (element === null || element === document.body) {
      return 'BODY'
    }

    return `${element.tagName.toLowerCase()}:${element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 24) ?? ''}`
  })

/** Whether focus is anywhere inside a dialog — the trap's own contract, read off the live tree. */
const focusIsInside = (dialog: Locator): Promise<boolean> =>
  dialog.evaluate((node) => node.contains(document.activeElement))

test.describe('the studio’s dialogs', () => {
  test.beforeEach(async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open('responsive-grid')
  })

  for (const { item, title } of DIALOGS) {
    test(`${item} restores focus to the File menu on Esc`, async ({ page }) => {
      const file = page.getByRole('button', { name: 'File' })

      /*
       * Focused and pressed rather than clicked: a mouse click does not focus a button in WebKit, so a
       * click-opened dialog has no trigger to return to on that engine — the platform's behaviour, not
       * the app's. Every engine focuses on `Enter`.
       */
      await file.focus()
      await page.keyboard.press('Enter')
      await page.getByRole('menuitem', { name: item }).click()

      const dialog = page.getByRole('dialog', { name: title })

      await expect(dialog).toBeVisible()
      // Focus is inside: a dialog that opens without moving focus is a dialog a keyboard cannot use.
      // Polled, because Radix moves focus in an effect after the content mounts — a read taken on
      // the mount itself finds the focus the trigger still has.
      await expect.poll(() => focusIsInside(dialog), { timeout: RESTORE_MS }).toBe(true)

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden({ timeout: RESTORE_MS })

      // The menu item is gone with the menu, so the trigger that survives is the File button.
      await expect(file).toBeFocused({ timeout: RESTORE_MS })
    })
  }

  test('the export dialog restores focus to the Export button', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /^Export/ })

    await trigger.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Export' })

    await expect(dialog).toBeVisible()
    await expect.poll(() => focusIsInside(dialog), { timeout: RESTORE_MS }).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden({ timeout: RESTORE_MS })
    await expect(trigger).toBeFocused({ timeout: RESTORE_MS })
  })

  test('the command palette gives focus back to what had it', async ({ page }) => {
    const studio = new StudioPage(page)

    const canvas = page.getByRole('application', { name: 'Design canvas' })

    await canvas.focus()

    // The modifier the registry matches, which is not the one the host suggests on WebKit.
    await studio.press('Mod+k')

    const palette = page.getByRole('dialog').filter({ has: page.getByRole('combobox') })

    await expect(palette).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(palette).toBeHidden({ timeout: RESTORE_MS })

    /*
     * Named first, and polled: the return happens in the frame after the dialog unmounts (ADR-325),
     * so a read taken on the hide finds `body`. It is kept beside `toBeFocused` because it is the
     * message worth having — "focus is on the body" says the restore did not run, where "the canvas
     * is not focused" does not say where focus went.
     */
    await expect.poll(() => focusedName(page), { timeout: RESTORE_MS }).not.toBe('BODY')
    await expect(canvas).toBeFocused({ timeout: RESTORE_MS })
  })
})
