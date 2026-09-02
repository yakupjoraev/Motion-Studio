import { expect, test } from '@playwright/test'

import { PlaygroundPage } from '../fixtures/playground-page'
import { StudioPage } from '../fixtures/studio-page'

/**
 * Flow D — PLAYGROUND.md § Testing. The value goes round the loop it was built for: dragged into
 * existence over the target, refused when it is wrong, sent into a document, carried in a link, and
 * refused again when the link is somebody else's idea of a good time.
 */
const HEXAGON = /^polygon\(/

test.describe('the clip-path vertex editor', () => {
  test('drags a vertex and both the value and the shape follow', async ({ page }) => {
    const playground = new PlaygroundPage(page)

    await playground.open()
    await playground.choose('clip-path')

    const before = await playground.editor('clip-path').textContent()

    await playground.dragVertex(0, 60, 20)

    await expect.poll(() => playground.editor('clip-path').textContent()).not.toBe(before)
    await expect.poll(() => playground.computed('clip-path')).toMatch(HEXAGON)
  })

  test('moves a vertex from the keyboard and announces where it landed', async ({ page }) => {
    const playground = new PlaygroundPage(page)

    await playground.open()
    await playground.choose('clip-path')
    await playground.vertex(0).focus()
    await page.keyboard.press('ArrowRight')

    await expect(playground.vertexAnnouncement()).toContainText(/^Vertex 1, /)
  })

  test('splits an edge and drops a vertex, keeping the minimum', async ({ page }) => {
    const playground = new PlaygroundPage(page)

    await playground.open()
    await playground.choose('clip-path')

    await playground.vertex(0).waitFor()

    const count = await playground.vertices().count()

    await playground.insertVertexOnEdge(1)

    await expect(playground.vertices()).toHaveCount(count + 1)

    await playground.vertex(0).focus()
    await page.keyboard.press('Delete')

    await expect(playground.vertices()).toHaveCount(count)
  })
})

test.describe('a value the browser refuses', () => {
  test('shows the reason and keeps the last valid render', async ({ page }) => {
    const playground = new PlaygroundPage(page)

    await playground.open()

    const painted = await playground.computed('background-image')

    await playground.write('background', 'linear-gradient(nonsense')

    await expect(playground.error()).not.toHaveText('')
    expect(await playground.computed('background-image')).toBe(painted)
  })
})

test.describe('a preset', () => {
  test('replaces the editor and the target together', async ({ page }) => {
    const playground = new PlaygroundPage(page)

    await playground.open()
    await playground.choose('clip-path')
    await playground.applyPreset('Star')

    await expect(playground.editor('clip-path')).toContainText('polygon(50% 0%')
    await expect.poll(() => playground.computed('clip-path')).toMatch(HEXAGON)
  })
})

test.describe('send to selection', () => {
  test('lands on the node as a chip, and undo takes it away', async ({ page }) => {
    const studio = new StudioPage(page)
    const playground = new PlaygroundPage(page)

    await studio.open('responsive-grid')
    await studio.canvas.selectNth(1)

    // A client-side navigation, which is what keeps the selection alive across the route — ADR-279.
    await studio.inspector.playgroundLink().click()
    await playground.editor().waitFor()

    await expect(playground.sendButton()).toBeEnabled()

    await playground.sendButton().click()
    await page.goBack()

    await expect(studio.inspector.customCssChips()).toContainText('background')

    await studio.undo()

    await expect(studio.inspector.customCssChips()).toHaveCount(0)
  })

  test('is disabled with nothing selected and says why', async ({ page }) => {
    const playground = new PlaygroundPage(page)

    await playground.open()

    await expect(playground.sendButton()).toBeDisabled()
    await expect(playground.sendReason()).toContainText('Select one block')
  })
})

test.describe('permalinks', () => {
  test('round-trips a value into a fresh tab', async ({ page, context }) => {
    const playground = new PlaygroundPage(page)

    await playground.open()
    await playground.choose('box-shadow')
    await playground.write('box-shadow', '0 12px 30px rgb(0 0 0 / 0.4)')
    await expect.poll(() => playground.computed('box-shadow')).toContain('12px')

    await playground.permalinkButton().click()
    await expect(playground.copyStatus()).toContainText('Link copied.')

    const hash = new URL(page.url()).hash
    const fresh = await context.newPage()
    const reopened = new PlaygroundPage(fresh)

    await reopened.open(hash, 'box-shadow')

    await expect(reopened.editor('box-shadow')).toContainText('12px')
    await expect.poll(() => reopened.computed('box-shadow')).toContain('12px')

    await fresh.close()
  })

  test('refuses a hostile link and applies nothing from it', async ({ page }) => {
    const playground = new PlaygroundPage(page)
    const payload = Buffer.from('url(javascript:alert(1))').toString('base64url')

    await playground.open(`#p=background&v=${payload}`)

    await expect(playground.permalinkError()).not.toHaveText('')
    expect(await playground.computed('background-image')).not.toContain('javascript')
  })
})
