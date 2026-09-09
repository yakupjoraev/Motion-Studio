import { expect, test } from '@playwright/test'

/**
 * The catalogue sizes each card's stage from a table of block heights measured in a browser —
 * ADR-386. The table is what makes the cards fit their blocks without a layout shift, and it is also
 * the thing that quietly stops being true: a block gains a line of copy, its card either grows a wall
 * of air or cuts the block off, and nothing else in the suite notices.
 *
 * **What this asserts is the property, not the number.** The first version compared the table against
 * what the blocks measured and allowed eight pixels of drift. It failed on the runner with seven
 * blocks out by 18 to 80 px while passing on the machine the table was taken on: a block's height is
 * a function of the font it is laid out in, and the two browsers did not agree about the font. A gate
 * that only holds on one machine is measuring the machine (ADR-280).
 *
 * The table exists so that no card cuts its block off and no card is mostly air. That is what is
 * checked here, on whatever font the browser actually used. The measured heights are printed either
 * way, so a table that has drifted far enough to be worth rewriting says so with the numbers to write.
 */

/** Air above and below the block, in stage pixels: `MIN_AIR` doubled plus the widest step of the scale. */
const AIR_CEILING = 300

test.describe('the card stage table', () => {
  test.slow()

  test('gives every block a stage that fits it and does not drown it', async ({ page }) => {
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

    const rows = await page.evaluate((ceiling) => {
      const out: {
        id: string
        declared: number
        measured: number
        stage: number
        clipped: boolean
        air: number
        tooMuchAir: boolean
      }[] = []

      for (const card of document.querySelectorAll('[data-block-card]')) {
        const id = card.getAttribute('data-block-card') ?? ''
        const island = card.querySelector('[data-block-height]')
        const declared = Number(island?.getAttribute('data-block-height') ?? '0')
        const frame = card.querySelector('.ms-preview-frame')
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

        const stageHeight = Number.parseFloat(getComputedStyle(stage).height)
        const measured = Math.round(wrapper.offsetHeight - air * 2)
        const spare = Math.round(stageHeight - measured)

        out.push({
          id,
          declared,
          measured,
          stage: Math.round(stageHeight),
          clipped: measured > stageHeight + 1,
          air: spare,
          tooMuchAir: spare > ceiling,
        })
      }

      return out
    }, AIR_CEILING)

    /*
     * One direction only. A table entry is the tallest height the block has been measured at, so an
     * entry above what this machine lays out is the table doing its job on a machine with a narrower
     * font — the wall of air that produces is caught below, by `tooMuchAir`. An entry *under* the
     * measurement is the one that cuts blocks off, and it is the one worth naming with its number.
     */
    const drifted = rows.filter((row) => row.measured - row.declared > 8)

    if (drifted.length > 0) {
      // An annotation rather than a log: it lands in the report next to the run it came from, and
      // the numbers are what a person would paste into the table.
      test.info().annotations.push({
        type: 'card-stage drift',
        description: drifted.map((row) => `${row.id}: ${row.measured}`).join(', '),
      })
    }

    const clipped = rows.filter((row) => row.clipped)

    expect(
      clipped,
      `these blocks are taller than the stage they are shown on, so the card cuts them off:\n${clipped
        .map((row) => `  ${row.id}: block ${row.measured}, stage ${row.stage}`)
        .join('\n')}`,
    ).toEqual([])

    const airy = rows.filter((row) => row.tooMuchAir)

    expect(
      airy,
      `these blocks sit in more air than the scale allows, which is the wall of air ADR-386 removed:\n${airy
        .map((row) => `  ${row.id}: block ${row.measured}, stage ${row.stage}, air ${row.air}`)
        .join('\n')}`,
    ).toEqual([])
  })
})
