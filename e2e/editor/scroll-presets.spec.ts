import { type Locator, expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/**
 * The two presets ADR-349 moved off GSAP, in the studio rather than in a fragment assertion.
 *
 * A unit test can assert the CSS a preset prints. It cannot assert that the class reaches the
 * element, that the `@keyframes` are emitted beside it, or that the browser resolves the `calc` — and
 * those are the three things GSAP used to be responsible for. So this spec drives the motion panel
 * and then writes `--ms-scroll-progress` by hand, which is what the shared scroll bus does on a page
 * that scrolls (`CssMotion`); the canvas is not a page scroller, so the value is the only part a
 * spec stands in for.
 */
const FIXTURE = 'export-landing'

/**
 * `horizontal-scroll` declares `requiresChildren`, and every section in this fixture holds a
 * container. The root of the document is a `Container` and its layers row is `aria-disabled` — the
 * root is not a node a user selects — so the track is a section rather than the obvious name.
 */
const TRACK = 'Section'

const HEADING = 'Heading'

const CHANNEL = 'Scroll'

/** What the bus writes, once per frame, for every scroll preset — ANIMATION_SYSTEM.md § Scroll. */
const progress = async (element: Locator, value: number): Promise<void> => {
  await element.evaluate((node, amount) => {
    node.style.setProperty('--ms-scroll-progress', String(amount))
  }, value)
}

const computed = async (element: Locator, property: string): Promise<string> =>
  await element.evaluate(
    (node, name) => getComputedStyle(node).getPropertyValue(name).trim(),
    property,
  )

test.describe('scroll presets on the platform', () => {
  test('horizontal-scroll spends its distance on the children it moves', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)
    await studio.selectNode(TRACK)

    await studio.motion.open()
    await studio.motion.applyPreset('Horizontal scroll')

    const wrapper = studio.canvas.motionWrapper('ms-hscroll')

    await expect(wrapper).toHaveCount(1)

    // The distance is a custom property rather than a printed number, so one rule serves every value.
    expect(await computed(wrapper, '--ms-hscroll-distance')).toBe('1600px')
    // `hidden` would make the window a scroll container and take the export's pin out of the page's
    // scrollport, which is why the rule says `clip`.
    expect(await computed(wrapper, 'overflow-x')).toBe('clip')

    const child = wrapper.locator('> *:not(style)').first()

    // An identity matrix rather than `none`: the rule always declares a transform, and at a
    // progress of zero the `calc` resolves to `translate3d(0px, 0, 0)`.
    await progress(wrapper, 0)
    expect(await computed(child, 'transform')).toBe('matrix(1, 0, 0, 1, 0, 0)')

    await progress(wrapper, 0.5)
    expect(await computed(child, 'transform')).toBe('matrix(1, 0, 0, 1, -800, 0)')
  })

  test('scroll-timeline seeks a paused animation instead of running one', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)
    await studio.selectNode(HEADING)

    await studio.motion.open()
    await studio.motion.applyPreset('Scroll timeline')

    const wrapper = studio.canvas.motionWrapper('ms-scroll-timeline-')

    await expect(wrapper).toHaveCount(1)
    expect(await computed(wrapper, 'animation-play-state')).toBe('paused')
    expect(await computed(wrapper, 'animation-duration')).toBe('1s')

    // The keyframes travel with the element — one `<style>` per node in the studio, deduped by
    // content in an export.
    expect(await wrapper.locator('style').first().textContent()).toContain('@keyframes')

    // `0:opacity=0|0.5:opacity=1|1:y=-40`: fully faded in halfway, and the lift does not undo it.
    await progress(wrapper, 0)
    expect(await computed(wrapper, 'opacity')).toBe('0')

    await progress(wrapper, 0.5)
    expect(await computed(wrapper, 'opacity')).toBe('1')

    await progress(wrapper, 1)
    expect(await computed(wrapper, 'opacity')).toBe('1')
    expect(await computed(wrapper, 'transform')).toBe('matrix(1, 0, 0, 1, 0, -40)')
  })

  test('the panel draws the preset own controls in its channel', async ({ page }) => {
    const studio = new StudioPage(page)

    await studio.open(FIXTURE)
    await studio.selectNode(HEADING)

    await studio.motion.open()
    await studio.motion.applyPreset('Scroll timeline')

    // The scrub slider is the preset's own control, drawn from `preset.controls`.
    expect(await studio.motion.paramValue(CHANNEL, 'Scrub')).toBe(1)
  })
})
