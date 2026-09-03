import { PACE, click, moveTo, type, wait } from './pace.mjs'

/**
 * The four demos, one per flow in PRODUCT.md § User flows — `prompts/59`.
 *
 * These are not tests and they assert nothing: a demo's job is to show the product working, and a
 * failed expectation here would produce a recording of an error message. What they do share with
 * `e2e/flows/` is the path through the product, so a change that breaks a flow breaks its spec
 * first — which is the right place to find out.
 *
 * The pacing lives in `pace.mjs`. Everything here is the script.
 */

/** The palette filters on name and tags, never on id — `use-block-search`, so `aurora` finds it. */
const searchFor = async (page, term) => {
  const box = page.getByRole('searchbox', { name: 'Search blocks' })

  await box.fill(term)
  await page.waitForTimeout(320)
}

const card = (page, blockId) => page.locator(`[data-block-card="${blockId}"]`)

const insert = async (page, term, blockId) => {
  await searchFor(page, term)
  await moveTo(page, card(page, blockId))
  await wait(page, 220)
  await card(page, blockId).dblclick()
  await wait(page, PACE.beat)
}

/**
 * A palette card dropped near the top of the artboard, which is where an empty document's only drop
 * zone is. Aimed the way `e2e/fixtures/studio-palette` aims it: the centre of an empty artboard is a
 * long way from anything that accepts a block.
 */
const dropOnArtboard = async (page, blockId) => {
  const artboard = await page.getByTestId('canvas-artboard').boundingBox()

  if (artboard === null) {
    throw new Error('the artboard is not on screen')
  }

  const handle = card(page, blockId)
  const box = await moveTo(page, handle)

  await page.mouse.down()
  await wait(page, 260)
  // A short first move past dnd-kit's activation distance, then the travel the viewer follows.
  await page.mouse.move(box.x + box.width / 2 + 14, box.y + box.height / 2, { steps: 6 })
  await page.mouse.move(artboard.x + artboard.width / 2, artboard.y + 90, { steps: 34 })
  await wait(page, 420)
  await page.mouse.up()
  await wait(page, PACE.beat)
}

/**
 * The layers tree is a virtual window: a row nobody has filtered down to is absent from the DOM
 * rather than scrolled out of view, so a name is typed before it can be clicked.
 */
const selectLayer = async (page, name) => {
  const search = page.getByRole('searchbox', { name: 'Search layers' })

  await click(page, search, { after: 160 })
  await search.fill(name)
  await wait(page, 380)
  await click(page, page.getByRole('treeitem', { name: new RegExp(name, 'i') }).first())
  await search.fill('')
  await wait(page, 220)
}

/**
 * Flow B — the headline demo: compose a landing page, theme it, edit its copy, export a Next
 * project. The one asset a reader judges the project on, so it shows the whole loop and ends on
 * generated code rather than on the canvas.
 */
export async function composePage(page, origin) {
  await page.goto(`${origin}/studio`)
  await page.waitForSelector('[data-testid="canvas-root"]')

  // `base` is 375 px wide, and a demo of a landing page composed in a phone frame is a demo of the
  // wrong thing. The switch is also worth showing: it is the responsive engine in one click.
  await click(page, page.locator('[role="radio"][value="xl"]').first(), { after: 420 })
  await wait(page, PACE.beat)

  /*
   * The hero first, by double click. Then a drag, which is the interaction worth showing — and which
   * needs something already on the artboard to drop against.
   *
   * `hero-centered` rather than `hero-aurora`: the aurora drifts continuously, so every frame of the
   * recording differs in every pixel and the GIF cannot pack it — 4.1 MB against a 3 MB cap, measured.
   * The aurora is the whole subject of `grab-effect.gif`, which is where it belongs.
   */
  await insert(page, 'hero', 'hero-centered')
  await searchFor(page, 'pricing')
  await dropOnArtboard(page, 'pricing-table')

  // Theme: one pass recolours every block, which is the argument for a token-driven theme engine.
  await click(page, page.getByRole('tab', { name: 'Theme' }), { after: 420 })
  await click(page, page.locator('[data-preset="midnight"]'))
  await wait(page, PACE.read)

  // The copy, typed into the inspector and landing on the canvas.
  await click(page, page.getByRole('tab', { name: 'Layers' }), { after: 380 })
  await selectLayer(page, 'hero')

  const headline = page.getByRole('textbox', { name: 'Headline' }).first()

  if ((await headline.count()) > 0) {
    await type(page, headline, 'Ship the interface', { delay: 42 })
  }

  // Export, ending on generated code rather than on the canvas.
  await click(page, page.getByRole('button', { name: /^Export/ }).first(), { after: 420 })
  await page.getByTestId('export-dialog').waitFor()
  await click(page, page.getByRole('radio', { name: /Next\.js/ }), { after: 420 })
  await page.getByRole('tree', { name: 'Generated files' }).waitFor()
  await wait(page, PACE.read)
}

/** Steps a slider from the keyboard, one press at a time so the preview is seen following it. */
const step = async (page, slider, presses, key = 'ArrowRight') => {
  await moveTo(page, slider)
  await slider.focus()

  for (let press = 0; press < presses; press += 1) {
    await page.keyboard.press(key)
    await wait(page, 150)
  }

  await wait(page, PACE.beat)
}

/**
 * Flow A — arrive on a block page, tune it until the effect is unmistakable, take the code.
 *
 * Intensity goes up first for a reason that is about the demo rather than the product: the aurora
 * ships at 0.45 on a near-black stage, which is right on a page that has content in front of it and
 * almost invisible in a GIF that has nothing else to look at.
 */
export async function grabEffect(page, origin) {
  await page.goto(`${origin}/blocks/aurora-background`)
  await page.getByTestId('block-controls').waitFor()
  await wait(page, PACE.read)

  const controls = page.getByTestId('block-controls')

  await step(page, controls.getByRole('slider', { name: /intensity/i }).first(), 9)
  await step(page, controls.getByRole('slider', { name: /blur/i }).first(), 5, 'ArrowLeft')

  const tint = controls.getByRole('combobox', { name: /second tint/i }).first()

  if ((await tint.count()) > 0) {
    await click(page, tint, { after: 420 })

    const option = page.getByRole('option', { name: 'success' }).first()

    if ((await option.count()) > 0) {
      await click(page, option)
    } else {
      await page.keyboard.press('Escape')
    }
  }

  await wait(page, PACE.read)
  await click(page, page.getByTestId('copy-react').first())
  await wait(page, PACE.read)

  // Ends on the code, which is the point of the flow: the effect leaves as a component.
  await page.getByTestId('block-source').scrollIntoViewIfNeeded()
  await wait(page, PACE.read * 2)
}

/** Flow C — select a node, give it a preset, drag the spring, watch the curve follow. */
export async function tuneMotion(page, origin) {
  await page.goto(`${origin}/studio?fixture=export-landing`)
  await page.waitForSelector('[data-testid="canvas-root"] [data-node-id]')

  // The same reason as the headline demo: `base` is a 375 px frame, and this fixture is a landing.
  await click(page, page.locator('[role="radio"][value="xl"]').first(), { after: 380 })

  await click(page, page.getByRole('tab', { name: 'Layers' }))
  await selectLayer(page, 'badge')

  await click(page, page.getByRole('tab', { name: 'Motion' }))
  await page.getByTestId('motion-tab').waitFor()
  await wait(page, PACE.beat)

  await click(page, page.getByRole('button', { name: 'Magnetic', exact: true }))
  await wait(page, PACE.read)

  const stiffness = page.getByRole('slider', { name: 'Spring stiffness' }).first()

  if ((await stiffness.count()) > 0) {
    const box = await moveTo(page, stiffness)

    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2, { steps: 40 })
    await wait(page, 260)
    await page.mouse.up()
    await wait(page, PACE.read * 2)
  }
}

/** Flow D — the playground: drag a vertex, watch the value and the shape move together. */
export async function liveCss(page, origin) {
  await page.goto(`${origin}/playground`)
  await page.getByRole('textbox', { name: /^background value/ }).waitFor()
  await wait(page, PACE.beat)

  await click(page, page.getByRole('radio', { name: /^clip-path/ }))
  await page.getByRole('textbox', { name: /^clip-path value/ }).waitFor()
  await wait(page, PACE.read)

  for (const [index, dx, dy] of [
    [0, 70, 30],
    [2, -60, 40],
  ]) {
    const handle = page.getByTestId(`vertex-handle-${index}`)

    if ((await handle.count()) === 0) {
      break
    }

    const box = await moveTo(page, handle)

    await page.mouse.down()
    await wait(page, 200)
    await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 30 })
    await wait(page, 200)
    await page.mouse.up()
    await wait(page, PACE.read)
  }

  await wait(page, PACE.read)
}

export const FLOWS = {
  'compose-page': { run: composePage, title: 'Flow B — compose a page' },
  'grab-effect': { run: grabEffect, title: 'Flow A — grab one effect' },
  'tune-motion': { run: tuneMotion, title: 'Flow C — tune motion' },
  'live-css': { run: liveCss, title: 'Flow D — live CSS' },
}
