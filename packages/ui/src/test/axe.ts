import { axe } from 'jest-axe'
import { expect } from 'vitest'

/**
 * The axe assertion every component test uses, so the rule set is decided once.
 *
 * Two rules are off, and both are about page composition rather than about a component:
 *
 * - **`region`** — "some page content is not contained by landmarks". A component rendered on its own has no
 *   `<main>` around it, and an overlay is portalled to `document.body`, so this fires for every popover in
 *   the set. The rule belongs to the page tests in `e2e`, where there is a page to judge.
 * - **`page-has-heading-one`** — same reason: a fragment has no document outline to check.
 *
 * Nothing else is disabled. A component-level violation stays a failure, which is the point of asserting
 * `axe` per component at all.
 */
const PAGE_LEVEL_RULES = {
  region: { enabled: false },
  'page-has-heading-one': { enabled: false },
} as const

export async function expectNoViolations(element: Element | Document): Promise<void> {
  expect(await axe(element, { rules: PAGE_LEVEL_RULES })).toHaveNoViolations()
}
