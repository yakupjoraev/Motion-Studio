import type { CDPSession, Locator, Page } from '@playwright/test'

interface Box {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** A canvas gesture in screen pixels, which is the unit every one of them is expressed in. */
export interface Delta {
  readonly dx: number
  readonly dy: number
}

/** A missing box means the element is not laid out, and a gesture against `null` is unreadable. */
async function boxOf(locator: Locator, what: string): Promise<Box> {
  const box = await locator.boundingBox()

  if (box === null) {
    throw new Error(`${what} is not on screen`)
  }

  return box
}

/**
 * The studio, as a spec talks to it — TESTING.md § Page objects: no raw selectors in a spec, so a
 * chrome change costs one file rather than forty.
 */
export class StudioPage {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /** Opens the studio on a committed fixture and waits for it to be on screen, not merely fetched. */
  async open(fixture: string): Promise<void> {
    await this.page.goto(`/studio?fixture=${fixture}`)
    await this.page.waitForSelector(`html[data-fixture="${fixture}"]`)
    await this.page.waitForSelector('[data-testid="canvas-root"] [data-node-id]')
  }

  /**
   * The document's undo, through the key that runs it. The modifier is read off the same
   * `navigator` the shortcut registry normalises against rather than assumed from the host: a WebKit
   * run on Windows presents a macOS platform, and Playwright's own ControlOrMeta reads the host.
   */
  async undo(): Promise<void> {
    const modifier = await this.page.evaluate(() =>
      /mac|iphone|ipad|ipod/i.test(`${navigator.platform} ${navigator.userAgent}`)
        ? 'Meta'
        : 'Control',
    )

    await this.page.keyboard.press(`${modifier}+z`)
  }

  /** 4× CPU throttling — PERFORMANCE.md § Measurement: the profile every number here is taken at. */
  async throttleCpu(rate = 4): Promise<CDPSession> {
    const client = await this.page.context().newCDPSession(this.page)

    await client.send('Emulation.setCPUThrottlingRate', { rate })

    return client
  }

  nodeCount(): Promise<number> {
    return this.page.locator('[data-node-id]').count()
  }

  /**
   * A render count from `window.__renderCounts`. An ordinary production build strips the counters,
   * which is why `pnpm test:e2e:perf` builds with `MS_INSTRUMENT=1` first (ADR-315).
   */
  async renderCount(id: string): Promise<number> {
    const counts = await this.page.evaluate(() => window.__renderCounts ?? null)

    if (counts === null) {
      throw new Error(
        'window.__renderCounts is absent — the app under test was built without MS_INSTRUMENT=1',
      )
    }

    return counts[id] ?? 0
  }

  /** One of the five left-panel tabs, waited on rather than assumed to have switched. */
  async openPanelTab(name: string): Promise<void> {
    await this.page.getByRole('tab', { name }).click()
    await this.page
      .getByRole('tab', { name })
      .and(this.page.locator('[data-state="active"]'))
      .waitFor()
  }

  /** The layers tree: the one surface that selects a node at any depth in a single click. */
  async selectLayer(nodeId: string): Promise<void> {
    await this.openPanelTab('Layers')

    const row = this.page.locator(`[data-layer-row="${nodeId}"]`)

    await row.scrollIntoViewIfNeeded()
    await row.click()
    await this.page.locator(`[data-layer-row="${nodeId}"][data-selected="true"]`).waitFor()
  }

  /**
   * A node drag happens in the layers tree — the canvas has no node drag of its own. `whileHeld`
   * runs with the button still down, which is the window the re-render budget is about.
   */
  async dragLayer(
    nodeId: string,
    ontoNodeId: string,
    whileHeld?: () => Promise<void>,
  ): Promise<void> {
    await this.openPanelTab('Layers')

    const from = await boxOf(this.page.locator(`[data-layer-row="${nodeId}"]`), nodeId)
    const onto = await boxOf(this.page.locator(`[data-layer-row="${ontoNodeId}"]`), ontoNodeId)
    const x = from.x + from.width / 2

    await this.page.mouse.move(x, from.y + from.height / 2)
    await this.page.mouse.down()
    // Past the 4 px activation first, then to the target: one long move can outrun the collision pass.
    await this.page.mouse.move(x, from.y + from.height / 2 + 12, { steps: 5 })
    await this.page.mouse.move(x, onto.y + onto.height / 2, { steps: 25 })
    await whileHeld?.()
    await this.page.mouse.up()
  }

  /**
   * A scrub field is an `input[role=spinbutton]` dragged horizontally — `packages/ui` § scrub-field.
   * The panel scrolls, so the box is read after the control is on screen and not before.
   */
  async scrubControl(label: string, { pixels }: { pixels: number }): Promise<void> {
    const field = this.page.getByRole('spinbutton', { name: label })

    await field.scrollIntoViewIfNeeded()

    const box = await boxOf(field, `the ${label} control`)
    const y = box.y + box.height / 2

    await this.page.mouse.move(box.x + box.width / 2, y)
    await this.page.mouse.down()
    await this.page.mouse.move(box.x + box.width / 2 + pixels, y, { steps: 40 })
    await this.page.mouse.up()
  }

  /** The middle button, which is the one `usePan` owns — held space is the other half of the same gesture. */
  async pan({ dx, dy }: Delta, whileHeld?: () => Promise<void>): Promise<void> {
    const centre = await this.canvasCentre()

    await this.page.mouse.move(centre.x, centre.y)
    await this.page.mouse.down({ button: 'middle' })
    await this.page.mouse.move(centre.x + dx, centre.y + dy, { steps: 30 })
    await whileHeld?.()
    await this.page.mouse.up({ button: 'middle' })
  }

  /** `Ctrl` + wheel, which is what `isZoomWheel` reads — a bare wheel pans. */
  async zoom({ ticks }: { ticks: number }): Promise<void> {
    const centre = await this.canvasCentre()

    await this.page.mouse.move(centre.x, centre.y)
    await this.page.keyboard.down('Control')

    for (let tick = 0; tick < Math.abs(ticks); tick += 1) {
      await this.page.mouse.wheel(0, ticks > 0 ? -60 : 60)
    }

    await this.page.keyboard.up('Control')
  }

  /**
   * A press that hits nothing starts a marquee, so this begins on the margin beside the artboard —
   * the right-hand one, since the artboard is left-aligned, and below the ruler strip.
   */
  async marquee({ dx, dy }: Delta, whileHeld?: () => Promise<void>): Promise<void> {
    const box = await this.canvasBox()
    const x = box.x + box.width - 24
    const y = box.y + 40

    await this.page.mouse.move(x, y)
    await this.page.mouse.down()
    await this.page.mouse.move(x + dx, y + dy, { steps: 30 })
    await whileHeld?.()
    await this.page.mouse.up()
  }

  private async canvasBox(): Promise<Box> {
    return boxOf(this.page.locator('[data-testid="canvas-root"]'), 'the canvas')
  }

  private async canvasCentre(): Promise<{ x: number; y: number }> {
    const box = await this.canvasBox()

    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }

  /** Every listener the page holds, by type — the scheduler's whole reason to exist. */
  async listenerCounts(): Promise<Record<string, number>> {
    const client = await this.page.context().newCDPSession(this.page)
    const { result } = await client.send('Runtime.evaluate', { expression: 'window' })
    const objectId = result.objectId

    if (objectId === undefined) {
      throw new Error('window has no object id')
    }

    const { listeners } = await client.send('DOMDebugger.getEventListeners', { objectId })
    const counts: Record<string, number> = {}

    for (const listener of listeners) {
      counts[listener.type] = (counts[listener.type] ?? 0) + 1
    }

    await client.detach()

    return counts
  }
}
