import { expect, test } from '@playwright/test'

import { readyForShot, storyIndex, storyUrl } from '../fixtures/storybook'

/**
 * Every kind of inspector control, in two states — `prompts/09` § Controls.
 *
 * Two shots per kind rather than every story: the first story a control publishes is its resting
 * state, and the second is the one its author wrote to show the interesting case — a token that
 * cannot be resolved, a mixed selection, a value at the end of its range. Between them they cover
 * what a token change can break in a control; the fifth variant of a colour field does not.
 *
 * The list comes from Storybook's own index, so a control whose stories are renamed is followed and a
 * control added without stories is visible here as an absence rather than as a silence.
 */
interface ControlKind {
  readonly title: string
  readonly stories: readonly { readonly id: string; readonly name: string }[]
}

const controlKinds = (): readonly ControlKind[] => {
  const byTitle = new Map<string, { id: string; name: string }[]>()

  for (const entry of storyIndex()) {
    if (!entry.title.startsWith('Controls/') || entry.id.endsWith('--docs')) {
      continue
    }

    const stories = byTitle.get(entry.title) ?? []

    stories.push({ id: entry.id, name: entry.name })
    byTitle.set(entry.title, stories)
  }

  return [...byTitle.entries()]
    .map(([title, stories]) => ({ title, stories: stories.slice(0, 2) }))
    .sort((left, right) => left.title.localeCompare(right.title))
}

const KINDS = controlKinds()

/** The name a snapshot file takes: `Controls/ColorField` + `Mixed` → `color-field-mixed`. */
const slug = (title: string, name: string): string =>
  `${title.replace('Controls/', '')}-${name}`
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()

test.describe('every inspector control kind', () => {
  test.beforeAll(() => {
    // `packages/ui/src/controls` has twenty-five directories, one per kind — ENGINEERING_CONTRACT.md
    // § 3. A kind added without stories fails here rather than going unscreenshotted.
    expect(KINDS).toHaveLength(25)
  })

  for (const kind of KINDS) {
    for (const story of kind.stories) {
      test(slug(kind.title, story.name), async ({ page }) => {
        // The controls are studio chrome, and the studio is dark — ADR-318.
        await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
        await page.goto(storyUrl(story.id, { mode: 'dark', theme: 'studio-dark' }))

        const root = page.locator('#storybook-root')

        await root.waitFor()
        await readyForShot(page)

        /*
         * The control rather than the viewport: a control is a few hundred pixels in a 1440 × 900
         * frame, and a full-frame shot would spend 97 % of its pixels on the same empty surface —
         * which is also 97 % of the diff tolerance spent on nothing.
         */
        await expect(root).toHaveScreenshot(`${slug(kind.title, story.name)}.png`)
      })
    }
  }
})
