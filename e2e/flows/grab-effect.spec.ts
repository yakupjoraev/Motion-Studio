import { expect, test } from '@playwright/test'

import { GalleryPage } from '../fixtures/gallery-page'

/**
 * Flow A — PRODUCT.md § User flows: "a developer arrives, finds an effect, tunes it, copies the code,
 * and leaves in under 60 seconds." The spec walks it end to end on the block `prompts/52` names.
 */
const BLOCK = 'aurora-background'

test.describe('grabbing an effect', () => {
  test('shows the preview without a scroll', async ({ page }) => {
    const gallery = new GalleryPage(page)

    await gallery.openBlock(BLOCK)

    const preview = gallery.previewStage()
    await expect(preview).toBeVisible()

    // Above the fold means above the fold, not "reachable" — the box is inside the first viewport.
    const box = await preview.boundingBox()
    const height = page.viewportSize()?.height ?? 0

    expect(box).not.toBeNull()
    expect(box?.y ?? 0).toBeLessThan(height)

    await expect(gallery.copyReact()).toBeInViewport()
  })

  test('changes two controls, and the preview and the URL both follow', async ({ page }) => {
    const gallery = new GalleryPage(page)

    await gallery.openBlock(BLOCK)
    await expect(gallery.controls()).toBeVisible()
    // Server-rendered controls are clickable before they are wired up — see `interactive`.
    await gallery.interactive()

    await gallery.stepSlider(/blur/i, 6, 'ArrowLeft')
    await gallery.chooseOption(/second tint/i, 'success')

    await expect(page).toHaveURL(/blur=/)
    await expect(page).toHaveURL(/secondaryTint=success/)

    // The announcement is the only signal a screen reader gets that the picture changed.
    await expect(gallery.announcer()).not.toBeEmpty()
  })

  test('copies TypeScript that starts the way the exporter starts it', async ({
    page,
    context,
    browserName,
  }) => {
    const gallery = new GalleryPage(page)

    await gallery.openBlock(BLOCK)

    /*
     * The button answers, either way — which is the cross-browser assertion, and the one the
     * component was written for: "a browser can refuse clipboard access outright, and a button that
     * then does nothing is worse than one that says it could not." Which of the two answers arrives
     * is the browser's business: WebKit under automation has refused the write before, and there is
     * no permission Playwright can grant it.
     *
     * Watched rather than polled, because the answer lasts two seconds and a WebKit click on this
     * route has taken longer than that to return — see `watchCopyAnswer`.
     */
    await gallery.watchCopyAnswer()
    await gallery.copySource()

    await expect
      .poll(() => gallery.copyAnswer(), { timeout: 30_000 })
      .toMatch(/Copied|would not give access/)

    if (browserName !== 'chromium') {
      return
    }

    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const copied = await page.evaluate(() => navigator.clipboard.readText())

    // The exporter names a component after the block, not after its id — `Aurora`, not `aurora-background`.
    expect(copied).toContain('export function Aurora()')
    expect(copied).toContain('--ms-fx-tint')
    expect(copied.split('\n')[0]).toMatch(/^('use client'|import|\/\*|export)/)
  })

  test('restores a tuned block from its own URL in a fresh tab', async ({ page }) => {
    const gallery = new GalleryPage(page)

    await gallery.openBlock(BLOCK, '?blur=32&secondaryTint=success')

    await expect(gallery.select(/second tint/i)).toContainText('success')
    await expect(gallery.slider(/blur/i)).toHaveAttribute('aria-valuenow', '32')
  })

  test('says so quietly when the URL carries a value the block cannot take', async ({ page }) => {
    const gallery = new GalleryPage(page)

    await gallery.openBlock(BLOCK, '?blur=4000')

    await expect(gallery.rejectedParams()).toContainText('blur')
    // And the block is still on the page, at its default.
    await expect(gallery.previewStage()).toBeVisible()
  })

  test('switches the preview theme without remounting the block', async ({ page }) => {
    const gallery = new GalleryPage(page)

    await gallery.openBlock(BLOCK)

    const stage = gallery.previewStage()
    await expect(stage).toBeVisible()
    await gallery.interactive()

    const before = await stage.evaluate((element) => {
      const node = element.querySelector('[data-ms-effect]') ?? element.firstElementChild
      // A marker on the DOM node itself: if the node survives, the subtree was not remounted.
      node?.setAttribute('data-remount-probe', 'kept')

      return node !== null
    })
    expect(before).toBe(true)

    await gallery.setPreviewTheme(/paper/i)

    await expect(stage.locator('[data-remount-probe="kept"]')).toHaveCount(1)
  })
})

/**
 * `prompts/52`: "Every block's detail page renders without error (parameterised over the registry)."
 *
 * The registry is read off `/blocks` rather than imported, which needs no dependency here and proves
 * something an import could not: that the list and the detail pages agree about what exists. A card
 * whose page 404s fails this, and so does a page with no card pointing at it.
 */
test('every block in the catalogue has a detail page that renders', async ({ page }) => {
  test.slow()

  const gallery = new GalleryPage(page)

  await gallery.openCatalogue()

  const ids = await gallery.blockIds()

  expect(ids.length).toBeGreaterThan(60)

  const failures: string[] = []

  /*
   * A router prefetch is not a page error about a block. WebKit rejects Next's RSC prefetch of the
   * route it is leaving — `?_rsc=… due to access control checks` — as the navigation tears the
   * request down, and it does so on eight or ten of the seventy-two, differently each run. The
   * subject here is whether a block's page renders, so the fetch the framework abandoned on the way
   * out is filtered rather than counted.
   */
  const isRouterPrefetch = (message: string): boolean =>
    message.includes('_rsc=') ||
    message.includes('Load failed') ||
    // The same cause on the other side: a route chunk requested for the page being left, cancelled
    // when the navigation replaces the document. Seen once in five full runs, on a different block.
    message.includes('Loading chunk')

  page.on('pageerror', (error) => {
    if (!isRouterPrefetch(error.message)) {
      failures.push(`${page.url()}: ${error.message}`)
    }
  })

  for (const id of ids) {
    const response = await gallery.openBlock(id)

    expect(response?.status(), `${id} responds`).toBe(200)
    // Scoped to the page's own header: a preview brings the component's headings with it, which
    // ACCESSIBILITY.md § Landing, gallery, docs allows and ADR-303 explains.
    await expect(gallery.heading(), `${id} has a heading`).toBeVisible()
    await expect(gallery.source(), `${id} shows its source`).toBeVisible()
  }

  expect(failures).toEqual([])
})
