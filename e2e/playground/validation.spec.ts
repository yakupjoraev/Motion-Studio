import { type Page, expect, test } from '@playwright/test'

import { PlaygroundPage } from '../fixtures/playground-page'

/**
 * The layers a unit test cannot reach — PLAYGROUND.md § Parsing and validation. `CSS.supports` is
 * absent under `node` and under jsdom, so layer 3 is only ever exercised for real here, and so is the
 * rule the document states outright: on a bad value the last valid render stays on screen.
 *
 * The payloads are the ones in `packages/schema/src/sanitize/css/__fixtures__/malicious.ts`. They are
 * repeated rather than imported because `e2e` does not depend on a workspace package, and a payload
 * that has to be typed by hand is one a reader can see being typed.
 */
/** The page object is stateless, so a spec makes one where it needs one rather than passing it. */
const playground = (page: Page): PlaygroundPage => new PlaygroundPage(page)

/**
 * `insertText` rather than `type`: the editor auto-closes brackets and quotes, so a payload typed key
 * by key would come out balanced and quoted — which is the editor doing its job and the test measuring
 * the wrong thing. The page object's `write` is the paste path, and pasting is how a payload arrives.
 */
const write = (page: Page, value: string): Promise<void> =>
  playground(page).write('background', value)

const background = (page: Page): Promise<string> =>
  playground(page)
    .target()
    .evaluate((node) => getComputedStyle(node).backgroundImage)

test.beforeEach(async ({ page }) => {
  await playground(page).open()
})

test.describe('the blocklist, in the browser', () => {
  const payloads = [
    ['a remote url()', 'url(https://example.com/x.png)', 'data: image'],
    ['a javascript: url()', 'url(javascript:alert(1))', 'data: image'],
    ['an HTML data URL', 'url("data:text/html,<script>alert(1)</script>")', 'data: image'],
    ['@import', '@import "https://example.com/x.css"', '@import'],
    ['expression()', 'expression(alert(1))', 'expression()'],
    ['element()', 'element(#target)', 'element()'],
  ] as const

  for (const [label, payload, reason] of payloads) {
    test(`refuses ${label} and applies nothing`, async ({ page }) => {
      const before = await background(page)

      await write(page, payload)

      await expect(playground(page).error()).toContainText(reason)
      expect(await background(page)).toBe(before)
    })
  }

  test('allows the one exception, an inline data image', async ({ page }) => {
    await write(page, 'url("data:image/gif;base64,R0lGODlhAQABAAAAACw=")')

    await expect(playground(page).error()).toHaveText('')
    await expect.poll(() => background(page)).toContain('data:image/gif')
  })
})

test.describe('structure, while the value is half typed', () => {
  /*
   * That layer 1 answers *without* the debounce is asserted where the clock can be held still —
   * `use-apply-css.test.tsx`. What is asserted here is the half of it a fake clock cannot show: the
   * preview keeps the last valid render rather than blanking.
   */
  test('reports a missing bracket and keeps the last valid render', async ({ page }) => {
    const before = await background(page)

    await write(page, 'linear-gradient(red, blue')

    await expect(playground(page).error()).toContainText('Unclosed')
    await expect(playground(page).error()).toContainText('1 open parens, 0 closing')
    expect(await background(page)).toBe(before)
  })

  test('names the column, and the editor underlines from it', async ({ page }) => {
    await write(page, 'linear-gradient(red, blue')

    await expect(playground(page).error()).toContainText('column 16')
    await expect(playground(page).lintUnderline()).toBeVisible()
  })

  test('recovers the moment the value parses again', async ({ page }) => {
    await write(page, 'linear-gradient(red, blue')
    await page.keyboard.insertText(')')

    await expect(playground(page).error()).toHaveText('')
    await expect.poll(() => background(page)).toContain('linear-gradient')
  })
})

test.describe('layers 3 and 4, which need a browser', () => {
  test('refuses a value the browser refuses', async ({ page }) => {
    const before = await background(page)

    await write(page, 'banana')

    await expect(playground(page).error()).toContainText('does not accept')
    expect(await background(page)).toBe(before)
  })

  test('applies a modern value and says where it landed', async ({ page }) => {
    await write(page, 'oklch(62% 0.19 285)')

    await expect(playground(page).error()).toHaveText('')
    await expect(playground(page).compatibility()).toContainText('oklch()')
    await expect(playground(page).compatibility()).toContainText('Safari 15.4+')
  })

  test('says nothing about a value that uses nothing recent', async ({ page }) => {
    await write(page, 'red')

    await expect(playground(page).compatibility()).toBeHidden()
  })
})
