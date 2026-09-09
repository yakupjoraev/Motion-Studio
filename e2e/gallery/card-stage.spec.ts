import { expect, test } from '@playwright/test'

/**
 * The catalogue sizes each card's stage from a table of block heights measured in a browser —
 * ADR-386. The table is what makes the cards fit their blocks without a layout shift, and it is also
 * the thing that quietly stops being true: a block gains a line of copy, its card either grows a wall
 * of air or cuts the block off, and nothing else in the suite notices.
 *
 * So this spec measures the blocks. Each card publishes the height the table claims for it as
 * `data-block-height`; this compares that with what the block actually lays out at and names every
 * block that has moved, with the number to write into the table.
 *
 * Eight pixels of tolerance, because a font that loads a frame late can move a line box by one or two
 * and the stage rounds to a step anyway.
 */
const TOLERANCE = 8

test.describe('the card stage table', () => {
  test.slow()

  test('matches the height every block really lays out at', async ({ page }) => {
    await page.goto('/blocks')

    // Mount every preview: the stage only exists once its card has been scrolled near.
    const height = await page.evaluate(() => document.body.scrollHeight)

    for (let y = 0; y < height; y += 600) {
      await page.evaluate((to) => window.scrollTo(0, to), y)
      await page.waitForTimeout(200)
    }

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.querySelectorAll('[data-block-card] [data-testid="preview-skeleton"]')
                .length,
          ),
        { timeout: 60_000 },
      )
      .toBe(0)

    const drifted = await page.evaluate((tolerance) => {
      const out: { id: string; declared: number; measured: number }[] = []

      for (const card of document.querySelectorAll('[data-block-card]')) {
        const id = card.getAttribute('data-block-card') ?? ''
        const island = card.querySelector('[data-block-height]')
        const declared = Number(island?.getAttribute('data-block-height') ?? '0')
        const frame = card.querySelector('div[style*="container-type"]')
        const stage = frame?.firstElementChild?.firstElementChild as HTMLElement | null
        const wrapper = stage?.firstElementChild as HTMLElement | null

        if (stage === null || stage === undefined || wrapper === null || wrapper === undefined) {
          continue
        }

        const air = Number.parseFloat(getComputedStyle(wrapper).paddingTop) || 0
        // An effect layer fills its parent absolutely and lays out no height of its own: the stage is
        // the plate, the wrapper has no air, and there is nothing to compare.
        if (air === 0) {
          continue
        }

        out.push({ id, declared, measured: Math.round(wrapper.offsetHeight - air * 2) })
      }

      return out.filter((row) => Math.abs(row.declared - row.measured) > tolerance)
    }, TOLERANCE)

    expect(
      drifted,
      `these blocks no longer lay out at the height card-stage.ts records:\n${drifted
        .map((row) => `  ${row.id}: table says ${row.declared}, measured ${row.measured}`)
        .join('\n')}`,
    ).toEqual([])
  })
})
