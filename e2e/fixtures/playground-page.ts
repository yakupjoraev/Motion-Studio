import type { Locator, Page } from '@playwright/test'

/**
 * The playground, as a spec talks to it — TESTING.md § Page objects. The editor is CodeMirror, so
 * writing a value is `insertText` rather than `type`: auto-close would balance a payload that is
 * meant to arrive unbalanced, and pasting is how one arrives anyway.
 */
export class PlaygroundPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** A link names its own sandbox, so a spec that opens one says which editor to wait for. */
  async open(hash = '', property = 'background'): Promise<void> {
    await this.page.goto(`/playground${hash}`)
    await this.editor(property).waitFor()
  }

  /** The property list is a radiogroup; picking one swaps the sandbox and the editor's label. */
  async choose(property: string): Promise<void> {
    await this.page.getByRole('radio', { name: new RegExp(`^${property}`) }).click()
    await this.editor(property).waitFor()
  }

  editor(property = 'background'): Locator {
    return this.page.getByRole('textbox', { name: new RegExp(`^${property} value`) })
  }

  target(): Locator {
    return this.page.getByTestId('playground-target')
  }

  error(): Locator {
    return this.page.getByTestId('playground-error')
  }

  vertex(index: number): Locator {
    return this.page.getByTestId(`vertex-handle-${index}`)
  }

  /** Every handle on the shape, which is what an insert and a delete are counted against. */
  vertices(): Locator {
    return this.page.getByTestId(/^vertex-handle-/)
  }

  /** Where a keyboard move is narrated — "Vertex 1, 30% 10%". */
  vertexAnnouncement(): Locator {
    return this.page.getByTestId('vertex-announcement')
  }

  /** Splits one edge, by the button the editor draws on its midpoint. */
  async insertVertexOnEdge(edge: number): Promise<void> {
    await this.page.getByRole('button', { name: `Insert a vertex on edge ${edge}` }).click()
  }

  /** Why `Send to selection` is unavailable, which the button itself cannot say. */
  sendReason(): Locator {
    return this.page.getByTestId('send-reason')
  }

  /** What the permalink button reports after a copy. */
  copyStatus(): Locator {
    return this.page.getByTestId('copy-status')
  }

  /** The support note beside a value the older engines do not take. */
  compatibility(): Locator {
    return this.page.getByRole('list', { name: 'Compatibility' })
  }

  /** CodeMirror's own underline on the offending range — the diagnostic in the gutter is a chunk. */
  lintUnderline(): Locator {
    return this.page.locator('.cm-lintRange-error').first()
  }

  async write(property: string, value: string): Promise<void> {
    await this.editor(property).click()
    await this.page.keyboard.press('ControlOrMeta+a')
    await this.page.keyboard.insertText(value)
  }

  async applyPreset(name: string): Promise<void> {
    await this.page.getByRole('button', { name }).click()
  }

  /** What the element is actually painting, which is the only honest answer to "did it apply". */
  computed(property: string): Promise<string> {
    return this.target().evaluate(
      (node, name) => getComputedStyle(node).getPropertyValue(name),
      property,
    )
  }

  /** A drag in the target's own coordinates: a delta in pixels over the box the handles sit in. */
  async dragVertex(index: number, dx: number, dy: number): Promise<void> {
    const box = await this.vertex(index).boundingBox()

    if (box === null) {
      throw new Error(`vertex ${index} has no box`)
    }

    const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

    await this.page.mouse.move(from.x, from.y)
    await this.page.mouse.down()
    await this.page.mouse.move(from.x + dx, from.y + dy, { steps: 8 })
    await this.page.mouse.up()
  }

  sendButton(): Locator {
    return this.page.getByTestId('send-to-selection')
  }

  permalinkButton(): Locator {
    return this.page.getByTestId('copy-permalink')
  }

  permalinkError(): Locator {
    return this.page.getByTestId('permalink-error')
  }
}
