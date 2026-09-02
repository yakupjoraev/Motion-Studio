import { type Locator, type Page, expect } from '@playwright/test'

interface Box {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** A missing box means the row is not laid out, and a gesture against `null` is unreadable. */
async function boxOf(locator: Locator, what: string): Promise<Box> {
  const box = await locator.boundingBox()

  if (box === null) {
    throw new Error(`${what} is not on screen`)
  }

  return box
}

/**
 * The layers tree — EDITOR_ENGINE.md § Layers. The one surface that reaches a node at any depth, and
 * the only one with a drag between nodes: the canvas has no node drag of its own.
 *
 * The tree renders a **virtual window**, so a row nobody has scrolled or filtered to is absent from
 * the DOM rather than off-screen. Every method here accounts for that; a spec should not have to.
 */
export class StudioLayers {
  private readonly page: Page

  private readonly openTab: (name: string) => Promise<void>

  /**
   * The panel tab belongs to the shell rather than to the tree, so it is handed in: this object owns
   * the tree, and switching to it is the shell's business.
   */
  constructor(page: Page, openTab: (name: string) => Promise<void>) {
    this.page = page
    this.openTab = openTab
  }

  async open(): Promise<void> {
    await this.openTab('Layers')
  }

  /** One row by node id, for the fixtures whose ids are committed. */
  row(nodeId: string): Locator {
    return this.page.locator(`[data-layer-row="${nodeId}"]`)
  }

  /** Every row currently drawn as selected — what a multi-selection is counted from. */
  selectedRows(): Locator {
    return this.page.locator('[data-layer-row][data-selected="true"]')
  }

  async select(nodeId: string): Promise<void> {
    await this.open()

    const row = this.row(nodeId)

    await row.scrollIntoViewIfNeeded()
    await row.click()
    await this.page.locator(`[data-layer-row="${nodeId}"][data-selected="true"]`).waitFor()
  }

  /** A row held with `Shift` or `Mod` to extend or toggle the selection — SHORTCUTS.md. */
  async click(nodeId: string, modifiers?: ('Shift' | 'Control' | 'Meta')[]): Promise<void> {
    await this.open()

    const row = this.row(nodeId)

    await row.scrollIntoViewIfNeeded()
    await row.click(modifiers === undefined ? {} : { modifiers })
  }

  /** Puts keyboard focus on a row without selecting it — where every keyboard drag starts. */
  async focus(nodeId: string): Promise<void> {
    await this.open()
    await this.row(nodeId).focus()
    await expect(this.row(nodeId)).toBeFocused()
  }

  /**
   * Selects a node by the name the tree shows for it.
   *
   * A spec composing a page has ids it never saw — `insertBlock` lets the store mint them — so the
   * name is the only handle it has. Through the tree's own search box rather than by scrolling: a
   * node forty rows down a sixty-node document is not in the DOM to be scrolled to, and the filter
   * is also what a person would reach for.
   */
  async selectByName(name: string): Promise<void> {
    await this.open()

    const search = this.searchBox()

    await search.fill(name)

    const row = this.page.getByRole('treeitem', { name: new RegExp(name, 'i') }).first()

    await row.scrollIntoViewIfNeeded()
    await row.click()
    await this.selectedRows().first().waitFor()
    // Cleared, so the next call sees the whole tree rather than this call's filter.
    await search.fill('')
  }

  /**
   * The names the tree is showing, top to bottom — what a compose spec asserts it built.
   *
   * The panel is opened first: the tabs mount one panel at a time, so a tree nobody has switched to
   * is not in the DOM at all and would answer an empty list rather than fail.
   */
  async names(): Promise<string[]> {
    await this.open()
    // @tanstack/react-virtual measures the scroll container first and renders rows in the frame
    // after that, so a read taken on the switch itself finds an empty list rather than a wrong one.
    await this.page.locator('[data-layer-row]').first().waitFor()

    return this.page
      .locator('[data-layer-row]')
      .evaluateAll((rows) => rows.map((row) => row.textContent?.trim() ?? ''))
  }

  /**
   * Drags one row onto another. `whileHeld` runs with the button still down, which is the window the
   * re-render budget is about.
   */
  async drag(nodeId: string, ontoNodeId: string, whileHeld?: () => Promise<void>): Promise<void> {
    await this.open()

    const from = await boxOf(this.row(nodeId), nodeId)
    const onto = await boxOf(this.row(ontoNodeId), ontoNodeId)
    const x = from.x + from.width / 2

    await this.page.mouse.move(x, from.y + from.height / 2)
    await this.page.mouse.down()
    // Past the 4 px activation first, then to the target: one long move can outrun the collision pass.
    await this.page.mouse.move(x, from.y + from.height / 2 + 12, { steps: 5 })
    await this.page.mouse.move(x, onto.y + onto.height / 2, { steps: 25 })
    await whileHeld?.()
    await this.page.mouse.up()
  }

  private searchBox(): Locator {
    return this.page.getByRole('searchbox', { name: 'Search layers' })
  }
}
