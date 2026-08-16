import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * ACCESSIBILITY.md § Reduced motion. The second assertion matters more than the first: the classic
 * reduced-motion bug is not an animation that survives, it is content that never appears because
 * the reveal that was going to show it got disabled.
 */
test.describe('reduced motion', () => {
  test('runs no transform animation', async ({ page }) => {
    const studio = new StudioPage(page)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await studio.open('stress-motion-heavy')

    const animated = await page.evaluate(() =>
      document
        .getAnimations()
        .flatMap((animation) => {
          const effect = animation.effect

          return effect instanceof KeyframeEffect ? effect.getKeyframes() : []
        })
        .filter((frame) => 'transform' in frame),
    )

    expect(animated).toHaveLength(0)
  })

  test('leaves the document complete and readable', async ({ page }) => {
    const studio = new StudioPage(page)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await studio.open('stress-motion-heavy')

    const invisible = await page.evaluate(() =>
      [...document.querySelectorAll('[data-node-id]')]
        .filter((element) => {
          const style = getComputedStyle(element)

          return (
            Number(style.opacity) < 0.99 ||
            style.visibility === 'hidden' ||
            (element as HTMLElement).offsetHeight === 0
          )
        })
        .map((element) => element.getAttribute('data-node-id')),
    )

    expect(invisible).toEqual([])
    expect(await studio.nodeCount()).toBe(101)
  })
})
