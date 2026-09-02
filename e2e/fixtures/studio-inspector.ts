import { type Locator, type Page, expect } from '@playwright/test'

/**
 * The generated inspector and the breakpoint bar, as a spec talks to it — RESPONSIVE_ENGINE.md
 * § Editing semantics and prompt 23 § Controls.
 *
 * `setControl` takes a label and a value and finds the control itself. The inspector is generated from
 * a block's prop schema, so which widget a prop gets is the registry's decision and not a spec's: a
 * spec that named the widget would have to change when a prop moved from a select to a segmented row,
 * and nothing about that change is behaviour.
 */
export class StudioInspector {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Sets one control by its label, whichever widget the schema gave it.
   *
   * The order is the order the roles can be told apart in: a scrub field is a `spinbutton` and a
   * slider is a `slider`, both of which take a number, while a combobox and a textbox take text.
   */
  async setControl(label: string, value: string): Promise<void> {
    await this.ready()

    const textbox = this.byRole('textbox', label)

    if ((await textbox.count()) > 0) {
      await textbox.scrollIntoViewIfNeeded()
      await textbox.fill(value)
      await textbox.blur()

      return
    }

    const combobox = this.byRole('combobox', label)

    if ((await combobox.count()) > 0) {
      await combobox.scrollIntoViewIfNeeded()
      await combobox.click()
      await this.page.getByRole('option', { name: value, exact: true }).click()
      await expect(combobox).toContainText(value)

      return
    }

    const spinbutton = this.byRole('spinbutton', label)

    if ((await spinbutton.count()) > 0) {
      await this.stepTo(spinbutton, Number(value))

      return
    }

    const slider = this.byRole('slider', label)

    if ((await slider.count()) > 0) {
      await this.stepTo(slider, Number(value))

      return
    }

    const group = this.page.getByRole('radiogroup', { name: label })

    if ((await group.count()) > 0) {
      const choice = group.getByRole('radio', { name: value, exact: true })

      await choice.scrollIntoViewIfNeeded()
      await choice.click()
      await expect(choice).toBeChecked()

      return
    }

    throw new Error(`the inspector has no control labelled "${label}"`)
  }

  /**
   * Waits for the inspector to have drawn a block's controls.
   *
   * `block-inspector` is a chunk of its own — ADR-313 took it out of the studio's first load — so a
   * query fired at the moment a node is selected races the import and finds a skeleton. The failure
   * looks like a missing control rather than like a wait that was not made.
   */
  async ready(): Promise<void> {
    await this.page
      .locator('[data-testid="block-inspector"], [data-testid="inspector-multi"]')
      .first()
      .waitFor({ timeout: 30_000 })
  }

  /**
   * One control as an element, for the assertions that are about the control rather than its value —
   * the accessible description that says where an inherited value came from, above all.
   *
   * The roles are tried in the same order `setControl` writes them in, so a spec gets the widget the
   * schema actually gave the prop without having to know which one that is.
   *
   * The panel is waited for first, like `setControl` waits for it: the controls are a chunk, and a
   * lookup fired on the selection itself counts the roles in a skeleton and finds none.
   */
  async control(label: string): Promise<Locator> {
    await this.ready()

    for (const role of ['spinbutton', 'slider', 'textbox', 'combobox'] as const) {
      const candidate = this.byRole(role, label)

      if ((await candidate.count()) > 0) {
        return candidate
      }
    }

    throw new Error(`the inspector has no control labelled "${label}"`)
  }

  /**
   * The responsive marker beside the control — RESPONSIVE_ENGINE.md § Editing semantics.
   *
   * Three states, and the third is an absence: `overridden` at the breakpoint that wrote the value,
   * `inherited` above it, and no marker at all when what is on screen is the base value.
   */
  overrideMarker(): Locator {
    return this.page.locator('[data-override]')
  }

  /** The custom-CSS chips a value sent from the playground lands on — PLAYGROUND.md § Send. */
  customCssChips(): Locator {
    return this.page.getByTestId('custom-css-chips')
  }

  /** The link out to the playground, which navigates client-side and keeps the selection alive. */
  playgroundLink(): Locator {
    return this.page.getByTestId('playground-link')
  }

  /** What the panel says it is editing — "Editing md and up". */
  responsiveHeader(): Locator {
    return this.page.getByTestId('responsive-header')
  }

  /**
   * Drops the override at the current breakpoint.
   *
   * The button removes the key rather than writing the inherited value back: a key set to the base
   * value is still an override, still draws the accent dot, and still emits a dead Tailwind class.
   */
  async resetControl(label: string): Promise<void> {
    await this.page.getByRole('button', { name: `Reset ${label}` }).click()
  }

  /** What a control currently reports, for a value that has to be read back rather than set. */
  async readControl(label: string): Promise<string> {
    for (const role of ['spinbutton', 'slider'] as const) {
      const control = this.byRole(role, label)

      if ((await control.count()) > 0) {
        return (await control.getAttribute('aria-valuenow')) ?? ''
      }
    }

    const textbox = this.byRole('textbox', label)

    if ((await textbox.count()) > 0) {
      return textbox.inputValue()
    }

    const combobox = this.byRole('combobox', label)

    if ((await combobox.count()) > 0) {
      return (await combobox.textContent()) ?? ''
    }

    throw new Error(`the inspector has no readable control labelled "${label}"`)
  }

  /**
   * The breakpoint the inspector is editing at — the radio carries the breakpoint as its value.
   *
   * The artboard is the same switch's other half and it **transitions** to the new frame (ADR-164),
   * so the wait is for the laid-out width to have caught up with the width the style asks for. A
   * measurement taken during that transition reads a page 375 px wide that is on its way to 768.
   */
  async setBreakpoint(breakpoint: string): Promise<void> {
    const group = this.page.getByRole('radiogroup', { name: 'Breakpoint' })

    await group.getByRole('radio').first().waitFor()
    await this.page.locator(`[role="radio"][value="${breakpoint}"]`).click()

    /*
     * The header states which breakpoint is being edited — except at `base`, where it is absent by
     * design: an unconditional value needs no reminder. So the switch back is waited on the same
     * way, by the line going away.
     */
    if (breakpoint === 'base') {
      await expect(this.responsiveHeader()).toHaveCount(0)
    } else {
      await expect(this.responsiveHeader()).toContainText(breakpoint)
    }

    await this.artboardSettled()
  }

  /** True once the artboard's laid-out width equals the width its own style asks for. */
  private async artboardSettled(): Promise<void> {
    await expect
      .poll(() =>
        this.page.evaluate(() => {
          const artboard = document.querySelector<HTMLElement>('[data-testid="canvas-artboard"]')

          if (artboard === null) {
            return false
          }

          return Math.abs(artboard.clientWidth - Number.parseFloat(artboard.style.width)) < 1
        }),
      )
      .toBe(true)
  }

  /**
   * No node on the artboard scrolls sideways at the current breakpoint.
   *
   * A horizontal overflow is the failure a breakpoint edit produces and the editor hides: the canvas
   * clips, so a 1280 px child inside a 768 px parent looks deliberate until it reaches a browser.
   * Measured against `scrollWidth`, with a pixel of tolerance for a subpixel layout.
   */
  async expectNoOverflow(): Promise<void> {
    const overflowing = await this.page.evaluate(() => {
      const nodes = [...document.querySelectorAll<HTMLElement>('[data-node-id]')]

      return nodes
        .filter((node) => node.scrollWidth - node.clientWidth > 1)
        .map(
          (node) => `${node.getAttribute('data-node-id')}: ${node.scrollWidth}/${node.clientWidth}`,
        )
    })

    expect(overflowing, 'nodes that scroll sideways at this breakpoint').toEqual([])
  }

  private byRole(role: 'textbox' | 'combobox' | 'spinbutton' | 'slider', label: string): Locator {
    return this.page.getByRole(role, { name: label })
  }

  /**
   * A scrub field and a slider are both driven by arrows rather than by typing — neither is an
   * `<input type=number>`, and both report where they are through `aria-valuenow`, which is what makes
   * the loop terminating rather than a fixed count of presses.
   */
  private async stepTo(control: Locator, target: number): Promise<void> {
    await control.scrollIntoViewIfNeeded()
    await control.focus()

    for (let step = 0; step < 200; step += 1) {
      const now = Number(await control.getAttribute('aria-valuenow'))

      if (now === target) {
        return
      }

      await control.press(now < target ? 'ArrowUp' : 'ArrowDown')

      if (Number(await control.getAttribute('aria-valuenow')) === now) {
        throw new Error(`the control stopped at ${now} on the way to ${target}`)
      }
    }

    throw new Error(`the control did not reach ${target} in 200 presses`)
  }
}
