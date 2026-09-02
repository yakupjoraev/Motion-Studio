import { type Locator, type Page, expect } from '@playwright/test'

/**
 * The block palette, as a spec talks to it — TESTING.md § Page objects.
 *
 * Insertion has two paths and they are not the same code: a double click runs `insertBlockAtSelection`
 * from the card's `onDoubleClick`, and `Enter` runs it from the grid's key handler. A spec that only
 * exercised one would leave the other free to break, so both are methods here.
 */
export class StudioPalette {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** The Blocks tab, waited on being active rather than assumed to have switched. */
  async open(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Blocks' }).click()
    await this.searchBox().waitFor()
  }

  /** The palette's search box — the first stop a keyboard user reaches inside the panel. */
  searchBox(): Locator {
    return this.page.getByRole('searchbox', { name: 'Search blocks' })
  }

  /**
   * Types into the search box and waits for the count to settle on the filtered set. The grid is
   * virtual, so a card off the window is absent from the DOM rather than hidden — the count is the
   * only honest signal that the filter has been applied.
   */
  async search(query: string): Promise<void> {
    const box = this.searchBox()

    await box.fill(query)
    await expect.poll(() => this.count()).toBeGreaterThan(0)
  }

  /** The count element is empty until something has been typed — `blocks-tab` renders it that way. */
  async searchCount(query: string): Promise<number> {
    await this.search(query)

    return this.count()
  }

  card(blockId: string): Locator {
    return this.page.locator(`[data-block-card="${blockId}"]`)
  }

  /** How many blocks the palette is currently offering, off its own announced count. */
  async count(): Promise<number> {
    const text = (await this.page.getByTestId('block-count').textContent()) ?? ''

    return Number(/(\d+)/.exec(text)?.[1] ?? Number.NaN)
  }

  /**
   * Inserts one block by the pointer path, resolving the search first so the card is in the virtual
   * window. Answers with the document's node count afterwards, which is what a caller asserts on.
   */
  async insert(blockId: string): Promise<void> {
    await this.reveal(blockId)
    await this.card(blockId).dblclick()
  }

  /**
   * Inserts whatever the palette offers first, for a spec that needs *a* block rather than a given
   * one — persistence is about the document surviving, not about which block is in it. Answers with
   * the id that went in, so the caller can say what it put there if an assertion fails.
   */
  async insertFirst(): Promise<string> {
    await this.open()

    const card = this.page.getByTestId('block-card').first()

    await card.waitFor()
    await card.dblclick()

    return (await card.getAttribute('data-block-card')) ?? ''
  }

  /** The keyboard path: focus the card through the grid's roving tabindex, then `Enter`. */
  async insertByKeyboard(blockId: string): Promise<void> {
    await this.reveal(blockId)
    await this.card(blockId).focus()
    await expect(this.card(blockId)).toBeFocused()
    await this.page.keyboard.press('Enter')
  }

  /**
   * Walks `Tab` until a palette card has focus, and answers with the id of the one that got it.
   *
   * A fixed number of presses would be measuring one engine: the category chips between the search
   * box and the grid are a different count of stops in each, and the grid holds a single stop of its
   * own through a roving tabindex.
   */
  async tabToFirstCard(limit = 24): Promise<string> {
    for (let press = 0; press < limit; press += 1) {
      await this.page.keyboard.press('Tab')

      const focused = await this.page.evaluate(
        () => document.activeElement?.getAttribute('data-block-card') ?? null,
      )

      if (focused !== null) {
        return focused
      }
    }

    throw new Error(`no palette card took focus in ${limit} tab presses`)
  }

  /**
   * Drags a card onto the canvas — the third insertion path, and the only one that goes through
   * dnd-kit. Past the activation distance first: one long move can outrun the collision pass.
   */
  async dragToCanvas(blockId: string, target: { x: number; y: number }): Promise<void> {
    await this.reveal(blockId)

    const card = this.card(blockId)
    const box = await card.boundingBox()

    if (box === null) {
      throw new Error(`the ${blockId} card is not on screen`)
    }

    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await this.page.mouse.down()
    await this.page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2, { steps: 5 })
    await this.page.mouse.move(target.x, target.y, { steps: 25 })
    await this.page.mouse.up()
  }

  /**
   * Brings one card into the DOM. The grid renders a window over the catalogue, so a card nobody has
   * filtered down to is absent rather than off-screen, and the filter matches a block's **name, tags,
   * description and category** — never its id (`use-block-search`). `hero-aurora` therefore finds
   * nothing, and `aurora` finds the card that carries that id.
   *
   * So the terms are tried in order — the whole id first, then each word of it — and the first that
   * puts the card in the DOM wins. A caller still names blocks by id, which is the stable identifier;
   * the display name is chrome and is free to change.
   */
  private async reveal(blockId: string): Promise<void> {
    await this.open()

    const box = this.searchBox()

    for (const term of [blockId, ...blockId.split('-')]) {
      await box.fill(term)

      if ((await this.card(blockId).count()) > 0) {
        return
      }
    }

    throw new Error(`no term derived from "${blockId}" brings its card into the palette`)
  }
}
