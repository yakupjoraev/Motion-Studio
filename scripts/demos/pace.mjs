/**
 * Human pacing — `prompts/59`: "a demo that moves faster than a human can follow shows nothing".
 *
 * Playwright's own actions are instant by design, which is right for a test and wrong for a
 * recording: a click lands before the eye has found the control, and a drag teleports. Everything a
 * demo does goes through these four functions instead, so the pacing is one decision in one place
 * rather than a scattering of `waitForTimeout`s.
 *
 * The numbers are the ones a viewer reads as deliberate rather than slow, taken from watching the
 * first recording at 12 fps: under ~250 ms a move is a jump, over ~1200 ms a pause is dead air.
 */
export const PACE = {
  /** Between one step of a flow and the next. */
  beat: 520,
  /** After something appears that the viewer is meant to read. */
  read: 950,
  /** Pointer travel, in event steps: enough that the follower draws a line rather than a jump. */
  steps: 26,
}

export const wait = (page, ms) => page.waitForTimeout(ms)

/** Moves to the middle of a locator and stops there, so the click that follows is visibly aimed. */
export async function moveTo(page, locator, { steps = PACE.steps } = {}) {
  await locator.scrollIntoViewIfNeeded()

  const box = await locator.boundingBox()

  if (box === null) {
    throw new Error('the demo aimed at something with no box on screen')
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps })

  return box
}

/** Travel, settle, press — the three parts of a click a viewer can actually follow. */
export async function click(page, locator, { settle = 260, after = PACE.beat } = {}) {
  await moveTo(page, locator)
  await wait(page, settle)
  await page.mouse.down()
  await wait(page, 90)
  await page.mouse.up()
  await wait(page, after)
}

/** A drag with the button held across visible intermediate positions, for the drop indicators. */
export async function dragTo(page, from, to, { hold = 320 } = {}) {
  await moveTo(page, from)
  await page.mouse.down()
  await wait(page, hold)
  await moveTo(page, to, { steps: PACE.steps * 2 })
  await wait(page, hold)
  await page.mouse.up()
  await wait(page, PACE.beat)
}

/** Typing at a speed that reads as typing. `fill` would make the text appear all at once. */
export async function type(page, locator, text, { delay = 55 } = {}) {
  await click(page, locator, { after: 160 })
  await locator.fill('')
  await locator.type(text, { delay })
  await wait(page, PACE.beat)
}
