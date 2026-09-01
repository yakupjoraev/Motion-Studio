import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { type ConsoleMessage, type Page, expect, test } from '@playwright/test'

import { settled } from '../fixtures/settle'

/**
 * The exported page, running as a project of its own — DEVOPS.md § Export smoke test. The workflow
 * exports `export-landing`, installs it with **npm**, builds it and starts it; these specs are what
 * "the export works" means once it is running.
 *
 * The claims are about the page a user would ship, so nothing here reaches into our own source: the
 * document is read only to count what the page should contain.
 */
const DOCUMENT = join(
  import.meta.dirname,
  '..',
  'fixtures',
  'documents',
  'export-landing.motion.json',
)

interface FixtureNode {
  readonly children: readonly string[]
}

const document_ = JSON.parse(readFileSync(DOCUMENT, 'utf8')) as {
  rootId: string
  nodes: Record<string, FixtureNode>
}

const sectionCount = document_.nodes[document_.rootId]?.children.length ?? 0

/** The sections, whichever element the export made the page root. */
const SECTIONS = 'body > div > *, body > main > *'

/**
 * Every assertion below is about the settled page. Motion's `useReducedMotion` answers after mount,
 * so the first frame of an entrance is hidden whatever the setting is, and a check that raced it
 * would be a check on our timing rather than on the page.
 */
async function open(page: Page): Promise<void> {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
}

test('renders one element for every section the document holds', async ({ page }) => {
  await open(page)

  await expect(page.locator(SECTIONS)).toHaveCount(sectionCount)
})

test('runs its entrance animations', async ({ page }) => {
  await open(page)
  await page.mouse.wheel(0, 1200)

  // Polled rather than waited out: the entrance is triggered by an observer, and how long that takes
  // is a property of the machine. The assertion is that something started, not that 200 ms passed.
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0)
})

test('has no axe violations', async ({ page }) => {
  await open(page)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations.map((violation) => violation.id)).toEqual([])
})

/**
 * A React key warning in exported code is exactly the kind of detail a reviewer notices, so a warning
 * fails this as hard as an error does.
 */
test('logs nothing to the console', async ({ page }) => {
  const noise: string[] = []

  page.on('console', (message: ConsoleMessage) => {
    const kind = message.type()

    // A failed resource is reported twice — here without a URL, and by the response below with one.
    if ((kind === 'error' || kind === 'warning') && !message.text().startsWith('Failed to load')) {
      noise.push(`${kind}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => noise.push(`pageerror: ${error.message}`))
  page.on('response', (response) => {
    // Chrome asks every origin for `/favicon.ico`, and an exported project has no icon: choosing one
    // would be inventing the user's branding. The request is the browser's, not the page's.
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      noise.push(`${response.status()}: ${response.url()}`)
    }
  })

  await open(page)
  await page.mouse.wheel(0, 2000)
  // The subject is what the page requested, so the wait is for it to have stopped requesting.
  await settled(page)

  expect(noise).toEqual([])
})

/**
 * ENGINEERING_CONTRACT.md § 1.6. The setting is emulated on the page rather than declared with
 * `test.use`, because the assertion has to be able to prove the browser is in the mode it names.
 */
test('is coherent under prefers-reduced-motion: reduce', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)

  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
    true,
  )
  await expect(page.locator(SECTIONS)).toHaveCount(sectionCount)

  const faintest = async (): Promise<number> =>
    page.evaluate((selector) => {
      const nodes = [...document.querySelectorAll(selector)]

      return Math.min(...nodes.map((node) => Number(getComputedStyle(node).opacity)))
    }, SECTIONS)

  // Every section, including the ones no scroll ever reached: reduced motion is not a shorter fade.
  await expect.poll(faintest, { timeout: 5_000 }).toBeGreaterThan(0)
})

/**
 * ADR-261: the exported colour-mode toggle is inert. The block ships `lib/color-mode.ts` and the
 * markup its canvas renders, and nothing wires the two together — a markup producer emits elements,
 * not handlers. The spec is written down rather than dropped so the gap has a name and a test to
 * un-skip when the export learns to wire a handler.
 */
test.fixme('switches the colour mode and keeps the choice across a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /dark/i }).click()

  await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark')

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark')
})
