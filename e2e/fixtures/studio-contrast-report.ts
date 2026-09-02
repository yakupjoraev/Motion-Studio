import type { Locator, Page } from '@playwright/test'

/**
 * The contrast report inside the theme panel — `THEME_ENGINE.md` § Contrast repair.
 *
 * Both halves of that section are structural and both are addressable here: a failing pair is never
 * silent, and the author's decision to keep it is never silent either. `Keep mine` and `Repair it`
 * are the same door in its two states, so a spec that clicked one asserts on the other.
 */
export class StudioContrastReport {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** The summary line the panel shows and the live region announces — "1 contrast repair." */
  summary(): Locator {
    return this.page.getByText(/contrast repair/).first()
  }

  keepMine(): Locator {
    return this.page.getByRole('button', { name: 'Keep mine' })
  }

  repairIt(): Locator {
    return this.page.getByRole('button', { name: 'Repair it' })
  }

  /** Declines the repair: the failing pair is what ships, and the way back stays on screen. */
  async keep(): Promise<void> {
    await this.keepMine().click()
  }

  async repair(): Promise<void> {
    await this.repairIt().click()
  }
}
