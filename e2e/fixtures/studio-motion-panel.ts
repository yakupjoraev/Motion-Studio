import { type Locator, type Page, expect } from '@playwright/test'

/**
 * The motion tab, as a spec talks to it — ANIMATION_SYSTEM.md § Presets.
 *
 * A preset card states its accessible name rather than computing one: a css preset injects the
 * `@keyframes` of its own preview into the button, and a computed name would read the stylesheet
 * aloud. That is why the name here is the preset's display name and not its id.
 */
export class StudioMotionPanel {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async open(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Motion' }).click()
    await this.page.getByTestId('motion-tab').waitFor()
  }

  card(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true })
  }

  /** Applies a preset and waits for the card to say so, which is the store's answer and not a hope. */
  async applyPreset(name: string): Promise<void> {
    const card = this.card(name)

    await card.scrollIntoViewIfNeeded()
    await card.click()
    await expect(card).toHaveAttribute('aria-pressed', 'true')
  }

  /**
   * One channel's parameters — the sliders `MotionParams` renders from `preset.controls`.
   *
   * Scoped to the channel, because a node can carry a preset on several of them at once: a block with
   * an entrance *and* a hover preset draws two parameter panels, each with a spring of its own, and an
   * unscoped query would be asking which one at random.
   */
  params(channel: string): Locator {
    return this.page
      .locator(`[data-testid="motion-channel"][data-channel="${channel.toLowerCase()}"]`)
      .getByTestId('motion-params')
  }

  /**
   * Drags one parameter slider by a number of pixels rather than to a value.
   *
   * The spring editor quantises on commit — the drag is continuous and the committed value snaps to
   * the nearest named spring (ADR-151) — so a spec asks for a gesture and asserts on what the document
   * ends up holding. Setting a number here would be asserting the quantiser's arithmetic twice.
   */
  async dragParam(channel: string, label: string, pixels: number): Promise<void> {
    const slider = this.params(channel).getByRole('slider', { name: label })

    await slider.scrollIntoViewIfNeeded()

    const box = await slider.boundingBox()

    if (box === null) {
      throw new Error(`the ${label} slider is not on screen`)
    }

    const y = box.y + box.height / 2

    await this.page.mouse.move(box.x + box.width / 2, y)
    await this.page.mouse.down()
    await this.page.mouse.move(box.x + box.width / 2 + pixels, y, { steps: 20 })
    await this.page.mouse.up()
  }

  /** What a parameter reports now — `aria-valuenow`, which is the value a screen reader is given. */
  async paramValue(channel: string, label: string): Promise<number> {
    const slider = this.params(channel).getByRole('slider', { name: label })

    return Number(await slider.getAttribute('aria-valuenow'))
  }
}
