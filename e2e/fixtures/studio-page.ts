import type { CDPSession, Page } from '@playwright/test'

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

  /** 4× CPU throttling — PERFORMANCE.md § Measurement: the profile every number here is taken at. */
  async throttleCpu(rate = 4): Promise<CDPSession> {
    const client = await this.page.context().newCDPSession(this.page)

    await client.send('Emulation.setCPUThrottlingRate', { rate })

    return client
  }

  nodeCount(): Promise<number> {
    return this.page.locator('[data-node-id]').count()
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
