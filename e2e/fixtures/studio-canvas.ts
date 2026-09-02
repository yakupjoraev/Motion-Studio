import { type Locator, type Page, expect } from '@playwright/test'

/**
 * The artboard and what is drawn over it — CANVAS.md § Overlays.
 *
 * A node is addressed by its id where a spec has one and by position where it does not: a document a
 * spec composed itself has ids the store minted, and the only stable handle on such a node is where
 * it sits. Both paths wait for the selection chip rather than for the click, because the chip is
 * drawn by the overlay layer a frame after the store commits.
 */
export class StudioCanvas {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** Every node currently on the artboard, which is what a reload assertion counts. */
  nodes(): Locator {
    return this.page.locator('[data-node-id]')
  }

  count(): Promise<number> {
    return this.nodes().count()
  }

  /**
   * Selects a node by id.
   *
   * Through `[data-node-id]` and not the layers tree: the point of a canvas selection is that the
   * canvas takes one. Note that a click on the element selects the **outermost** node under the
   * pointer, which is why a spec after a specific inner node goes through the layers tree instead.
   */
  async select(nodeId: string): Promise<void> {
    await this.page.locator(`[data-node-id="${nodeId}"]`).click()
    await this.selectionChip().waitFor()
  }

  /** Selects by position, for a document whose ids the spec never saw. */
  async selectNth(index: number): Promise<void> {
    await this.nodes().nth(index).click()
    await this.selectionChip().waitFor()
  }

  /** The overlay's name badge — the one surface that says a selection exists at all. */
  selectionChip(): Locator {
    return this.page.getByTestId('selection-chip')
  }

  artboard(): Locator {
    return this.page.getByTestId('canvas-artboard')
  }

  /** What the breakpoint overlay says the current frame is — "lg · 1024". */
  breakpointLabel(): Locator {
    return this.page.getByTestId('breakpoint-label')
  }

  /**
   * The side-by-side comparison — RESPONSIVE_ENGINE.md § Multi-frame. It replaces the canvas rather
   * than sitting beside it, so the caller is handed the view and the single canvas is gone.
   */
  async toggleMultiFrame(): Promise<void> {
    await this.page.keyboard.press('Control+Shift+M')
  }

  multiFrame(): Locator {
    return this.page.getByTestId('multi-frame-view')
  }

  frame(breakpoint: string): Locator {
    return this.page.getByTestId(`frame-${breakpoint}`)
  }

  root(): Locator {
    return this.page.getByTestId('canvas-root')
  }

  /**
   * The largest run of vertical space on the artboard where nothing is painted — no text leaf, no
   * border, no image.
   *
   * Two stacked sections add their paddings, and that is how a page acquires a hole: invisible in the
   * document, obvious on screen. Measured in artboard pixels, so the answer does not move with zoom.
   */
  largestEmptyRun(): Promise<number> {
    return this.page.evaluate(() => {
      const root = document.querySelector('[data-node-id]')

      if (root === null) {
        return 0
      }

      const scale = root.getBoundingClientRect().width / 1280
      const origin = root.getBoundingClientRect().top

      const spans = [...root.querySelectorAll('*')]
        .filter((element) => {
          const box = element.getBoundingClientRect()

          if (box.height < 1 || box.width < 1) {
            return false
          }

          const style = getComputedStyle(element)

          if (style.visibility === 'hidden' || style.opacity === '0') {
            return false
          }

          return (
            (element.children.length === 0 && (element.textContent ?? '').trim().length > 0) ||
            style.borderTopWidth !== '0px' ||
            style.borderBottomWidth !== '0px' ||
            element instanceof HTMLImageElement ||
            element instanceof SVGElement
          )
        })
        .map((element) => {
          const box = element.getBoundingClientRect()

          return { top: (box.top - origin) / scale, bottom: (box.bottom - origin) / scale }
        })
        .sort((left, right) => left.top - right.top)

      let reach = 0
      let worst = 0

      for (const span of spans) {
        worst = Math.max(worst, span.top - reach)
        reach = Math.max(reach, span.bottom)
      }

      return Math.round(worst)
    })
  }

  /** How many nodes are rounded at all, which is what a radius scale of 0 has to bring to zero. */
  async roundedNodeCount(): Promise<number> {
    return this.page.evaluate(
      () =>
        Array.from(document.querySelectorAll('[data-node-id]')).filter((node) => {
          const value = getComputedStyle(node).borderRadius

          return value !== '' && value !== '0px'
        }).length,
    )
  }

  /** Waits for the artboard to hold exactly this many nodes — a reload's assertion, not a poll. */
  async expectNodeCount(expected: number): Promise<void> {
    await expect(this.nodes()).toHaveCount(expected)
  }
}
