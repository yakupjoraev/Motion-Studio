import { axe } from 'jest-axe'
import { expect } from 'vitest'

/**
 * Two rules off, both about page composition rather than about a component: a fragment has no landmarks and
 * no document outline to check. Those belong to the `e2e` page tests. Nothing else is disabled.
 */
const PAGE_LEVEL_RULES = {
  region: { enabled: false },
  'page-has-heading-one': { enabled: false },
} as const

export async function expectNoViolations(element: Element | Document): Promise<void> {
  expect(await axe(element, { rules: PAGE_LEVEL_RULES })).toHaveNoViolations()
}
