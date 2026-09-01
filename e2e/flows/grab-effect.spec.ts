import { expect, test } from '@playwright/test'

/**
 * Flow A — PRODUCT.md § User flows: "a developer arrives, finds an effect, tunes it, copies the code,
 * and leaves in under 60 seconds." The spec walks it end to end on the block `prompts/52` names.
 */
const DETAIL = '/blocks/aurora-background'

test.describe('grabbing an effect', () => {
  test('shows the preview without a scroll', async ({ page }) => {
    await page.goto(DETAIL)

    const preview = page.getByTestId('block-preview-stage')
    await expect(preview).toBeVisible()

    // Above the fold means above the fold, not "reachable" — the box is inside the first viewport.
    const box = await preview.boundingBox()
    const height = page.viewportSize()?.height ?? 0

    expect(box).not.toBeNull()
    expect(box?.y ?? 0).toBeLessThan(height)

    await expect(page.getByTestId('copy-react').first()).toBeInViewport()
  })

  test('changes two controls, and the preview and the URL both follow', async ({ page }) => {
    await page.goto(DETAIL)

    const controls = page.getByTestId('block-controls')
    await expect(controls).toBeVisible()

    const blur = controls.getByRole('slider', { name: /blur/i })
    await blur.focus()
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press('ArrowLeft')
    }

    // The select is the studio's own control, which is a Radix combobox rather than a `<select>`.
    await controls.getByRole('combobox', { name: /second tint/i }).click()
    await page.getByRole('option', { name: 'success' }).click()

    await expect(page).toHaveURL(/blur=/)
    await expect(page).toHaveURL(/secondaryTint=success/)

    // The announcement is the only signal a screen reader gets that the picture changed.
    await expect(page.getByTestId('preview-announcer')).not.toBeEmpty()
  })

  test('copies TypeScript that starts the way the exporter starts it', async ({
    page,
    context,
    browserName,
  }) => {
    await page.goto(DETAIL)

    const button = page.getByTestId('copy-react').first()
    await button.click()

    /*
     * The button answers, either way — which is the cross-browser assertion, and the one the
     * component was written for: "a browser can refuse clipboard access outright, and a button that
     * then does nothing is worse than one that says it could not."
     *
     * WebKit under automation is that browser: `writeText` rejects, there is no permission Playwright
     * can grant it, and the button correctly stays as it was while the live region says why. Asserting
     * "Copied" on three engines was asserting that one of them would stop refusing.
     */
    await expect
      .poll(async () =>
        [
          await button.textContent(),
          await page.locator('[aria-live="polite"]').first().textContent(),
        ].join(' '),
      )
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
    await page.goto(`${DETAIL}?blur=32&secondaryTint=success`)

    const controls = page.getByTestId('block-controls')
    await expect(controls.getByRole('combobox', { name: /second tint/i })).toContainText('success')
    await expect(controls.getByRole('slider', { name: /blur/i })).toHaveAttribute(
      'aria-valuenow',
      '32',
    )
  })

  test('says so quietly when the URL carries a value the block cannot take', async ({ page }) => {
    await page.goto(`${DETAIL}?blur=4000`)

    await expect(page.getByTestId('rejected-params')).toContainText('blur')
    // And the block is still on the page, at its default.
    await expect(page.getByTestId('block-preview-stage')).toBeVisible()
  })

  test('switches the preview theme without remounting the block', async ({ page }) => {
    await page.goto(DETAIL)

    const stage = page.getByTestId('block-preview-stage')
    await expect(stage).toBeVisible()

    const before = await stage.evaluate((element) => {
      const node = element.querySelector('[data-ms-effect]') ?? element.firstElementChild
      // A marker on the DOM node itself: if the node survives, the subtree was not remounted.
      node?.setAttribute('data-remount-probe', 'kept')

      return node !== null
    })
    expect(before).toBe(true)

    await page.getByRole('radio', { name: /paper/i }).click()

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

  await page.goto('/blocks')

  const ids = await page.$$eval('[data-block-card]', (cards) =>
    cards.map((card) => card.getAttribute('data-block-card') ?? ''),
  )

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
    const response = await page.goto(`/blocks/${id}`)

    expect(response?.status(), `${id} responds`).toBe(200)
    // Scoped to the page's own header: a preview brings the component's headings with it, which
    // ACCESSIBILITY.md § Landing, gallery, docs allows and ADR-303 explains.
    await expect(
      page.locator('main > header').getByRole('heading', { level: 1 }),
      `${id} has a heading`,
    ).toBeVisible()
    await expect(page.getByTestId('block-source'), `${id} shows its source`).toBeVisible()
  }

  expect(failures).toEqual([])
})
