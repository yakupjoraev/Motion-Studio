import type { CDPSession, Locator, Page } from '@playwright/test'

import { StudioCanvas } from './studio-canvas'
import { StudioFileMenu } from './studio-file-menu'
import { StudioInspector } from './studio-inspector'
import { StudioLayers } from './studio-layers'
import { StudioMotionPanel } from './studio-motion-panel'
import { StudioPalette } from './studio-palette'
import { StudioThemePanel } from './studio-theme-panel'

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

  /**
   * One surface each, rather than forty methods on this class. The panels change independently — the
   * palette is prompt 37's, the theme builder is 36's — and a spec that only inserts blocks has no
   * reason to be recompiled when the spring editor moves.
   */
  readonly palette: StudioPalette
  readonly theme: StudioThemePanel
  readonly inspector: StudioInspector
  readonly motion: StudioMotionPanel
  readonly canvas: StudioCanvas
  readonly file: StudioFileMenu
  readonly layers: StudioLayers

  constructor(page: Page) {
    this.page = page
    this.palette = new StudioPalette(page)
    this.theme = new StudioThemePanel(page)
    this.inspector = new StudioInspector(page)
    this.motion = new StudioMotionPanel(page)
    this.canvas = new StudioCanvas(page)
    this.file = new StudioFileMenu(page)
    this.layers = new StudioLayers(page, (name) => this.openPanelTab(name))
  }

  /** Opens the studio on a committed fixture and waits for it to be on screen, not merely fetched. */
  async open(fixture: string): Promise<void> {
    await this.page.goto(`/studio?fixture=${fixture}`)
    await this.page.waitForSelector(`html[data-fixture="${fixture}"]`)
    await this.page.waitForSelector('[data-testid="canvas-root"] [data-node-id]')
  }

  /**
   * Opens the studio on an empty document — no `?fixture=`, which is the session a person gets.
   *
   * A fixture session neither restores nor autosaves (ADR-286), so a spec that composes a page has to
   * come in this way. Playwright hands every test a fresh context, so the restore finds nothing.
   */
  async openEmpty(): Promise<void> {
    await this.page.goto('/studio')
    await this.page.waitForSelector('[data-testid="canvas-root"]')
  }

  /**
   * The modifier the shortcut registry will match, read off the same `navigator` it normalises
   * against rather than assumed from the host: a WebKit run on Windows presents a macOS platform, and
   * Playwright's own `ControlOrMeta` reads the host, so the two disagree on exactly one browser.
   */
  async modifier(): Promise<'Meta' | 'Control'> {
    return this.page.evaluate(() =>
      /mac|iphone|ipad|ipod/i.test(`${navigator.platform} ${navigator.userAgent}`)
        ? 'Meta'
        : 'Control',
    )
  }

  /** A studio shortcut, with the modifier the app itself is listening for — `press('Mod+d')`. */
  async press(combination: string): Promise<void> {
    const modifier = await this.modifier()

    await this.page.keyboard.press(combination.replace(/^Mod\+/, `${modifier}+`))
  }

  /**
   * `F2` walks the three regions — UI_GUIDELINES.md § Focus and keyboard — and two presses land on
   * the left panel. The wait is on the region really holding focus, since the count of presses is
   * the app's contract and a spec that assumed it would pass against a broken key map.
   */
  async focusLeftPanel(): Promise<void> {
    await this.page.keyboard.press('F2')
    await this.page.keyboard.press('F2')
    await this.page.getByRole('complementary', { name: 'Left panel' }).waitFor()
  }

  /**
   * Waits for the shortcut host to be in the DOM — the element the global key map is bound to.
   *
   * A shortcut pressed before it mounts is a key press nothing is listening for, which fails as a
   * dialog that never opened rather than as a wait that was never made.
   */
  async shortcutsReady(): Promise<void> {
    await this.page.getByTestId('shortcut-host').waitFor({ state: 'attached' })
  }

  /** The document's undo, through the key that runs it. */
  async undo(): Promise<void> {
    await this.press('Mod+z')
  }

  /** 4× CPU throttling — PERFORMANCE.md § Measurement: the profile every number here is taken at. */
  async throttleCpu(rate = 4): Promise<CDPSession> {
    const client = await this.page.context().newCDPSession(this.page)

    await client.send('Emulation.setCPUThrottlingRate', { rate })

    return client
  }

  nodeCount(): Promise<number> {
    return this.canvas.count()
  }

  /**
   * What the status bar says about the selection — "Hero selected", "3 selected", or nothing.
   *
   * The store's own phrasing, which is also what the canvas announces, so a spec that asserts on it
   * is asserting the thing a user is told rather than an internal array's length.
   */
  async selectionLabel(): Promise<string> {
    return (await this.page.getByTestId('status-selection').textContent()) ?? ''
  }

  /**
   * What the studio announces after a command — "Add Section. 5 blocks." (ADR-326).
   *
   * The wording is the store's, so a spec asserts on the fact being announced rather than on a
   * sentence a rewrite would break.
   */
  announcer(): Locator {
    return this.page.getByTestId('command-announcer')
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

  /**
   * Selects a node by the name the layers tree shows for it — the call `prompts/56` § Flow B makes.
   * The tree is the surface that owns it; this is the shorthand a flow spec reads better with.
   */
  async selectNode(name: string): Promise<void> {
    await this.layers.selectByName(name)
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
