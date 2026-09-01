import type { CDPSession, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/** PERFORMANCE.md § Studio: "no upward trend" over half an hour. This is that run, compressed. */
const ITERATIONS = 500

/** Ten samples. Fewer than that and a slope is a line through noise. */
const SAMPLE_EVERY = 50

/** A fraction, not a byte count: the absolute heap moves with the Chrome build. */
const GROWTH_LIMIT = 0.2

/** Alternated rather than repeated: a setter that no-ops on an unchanged value would measure nothing. */
const ALTERNATES = { presetA: 'midnight', presetB: 'aurora', widthA: 'base', widthB: 'lg' } as const

const heapUsed = async (client: CDPSession): Promise<number> => {
  await client.send('HeapProfiler.collectGarbage')

  const { metrics } = await client.send('Performance.getMetrics')

  return metrics.find((metric) => metric.name === 'JSHeapUsedSize')?.value ?? 0
}

/**
 * One edit cycle, driven through the store: five hundred passes of palette drags would measure
 * Playwright's IPC. Every pass leaves the document as it found it; the history is what grows, until
 * `HISTORY_LIMIT` caps it.
 */
const runIterations = async (page: Page, count: number, offset: number): Promise<void> => {
  await page.evaluate(
    ({ count: total, offset: from, presetA, presetB, widthA, widthB }) => {
      const handle = window.studio

      if (handle === undefined) {
        throw new Error('window.studio is absent — the app was built without MS_INSTRUMENT=1')
      }

      const { store, commands } = handle

      for (let step = 0; step < total; step += 1) {
        const index = from + step
        const state = store.getState()
        const { rootId } = state.document

        state.dispatch(
          commands.insertBlock({
            blockId: 'heading',
            parentId: rootId,
            index: 0,
            slot: 'children',
          }),
        )

        const inserted = store.getState().document.nodes[rootId]?.children[0]

        if (inserted === undefined) {
          throw new Error('the insert produced no node')
        }

        store
          .getState()
          .dispatch(commands.setProp({ nodeId: inserted, path: 'text', value: `Pass ${index}` }))
        store.getState().dispatch(commands.removeNodes({ ids: [inserted] }))
        store.getState().undo()
        store.getState().dispatch(commands.removeNodes({ ids: [inserted] }))

        const even = index % 2 === 0

        store.getState().applyThemePreset(even ? presetA : presetB)
        store.getState().setBreakpoint(even ? widthA : widthB)
      }
    },
    { count, offset, ...ALTERNATES },
  )
}

/** Least squares, in bytes per iteration. The sign is what matters; the magnitude scales it. */
const slopePerIteration = (samples: readonly number[]): number => {
  const n = samples.length
  const meanX = (n - 1) / 2
  const meanY = samples.reduce((total, value) => total + value, 0) / n

  let covariance = 0
  let variance = 0

  for (const [index, value] of samples.entries()) {
    covariance += (index - meanX) * (value - meanY)
    variance += (index - meanX) ** 2
  }

  return (variance === 0 ? 0 : covariance / variance) / SAMPLE_EVERY
}

/**
 * PERFORMANCE.md § Studio, the last budget: half an hour of editing leaves the heap where it found
 * it. Five hundred passes, sampled every fifty after a forced collection, asserting the trend and
 * not the absolute number.
 */
test.describe('half an hour of editing', () => {
  test('does not leak over 500 scripted passes', async ({ page }, info) => {
    test.setTimeout(300_000)

    const studio = new StudioPage(page)

    await studio.open('responsive-grid')

    const client = await page.context().newCDPSession(page)

    await client.send('HeapProfiler.enable')
    await client.send('Performance.enable')

    const samples: number[] = []

    for (let done = 0; done < ITERATIONS; done += SAMPLE_EVERY) {
      await runIterations(page, SAMPLE_EVERY, done)
      samples.push(await heapUsed(client))
    }

    await client.detach()

    const mb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(2)} MB`
    const [first] = samples
    const last = samples.at(-1) ?? 0

    if (first === undefined) {
      throw new Error('no samples were taken')
    }

    const slope = slopePerIteration(samples)

    const line = `heap ${samples.map(mb).join(' → ')}; ${slope.toFixed(0)} B per pass`

    info.annotations.push({ type: 'measurement', description: line })
    console.log(`  ${line}`)

    // The first sample is taken after fifty passes, so the lazy chunks and the JIT are already paid for.
    expect(last).toBeLessThan(first * (1 + GROWTH_LIMIT))
    expect(slope * ITERATIONS).toBeLessThan(first * GROWTH_LIMIT)
  })
})
