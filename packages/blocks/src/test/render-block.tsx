import type { BlockDefinition } from '@motion-studio/schema'
import { type RenderResult, render } from '@testing-library/react'
import { axe } from 'jest-axe'
import type { ComponentType, ReactNode } from 'react'
import { expect } from 'vitest'

/**
 * A block is rendered the way the canvas renders it: its own defaults, parsed by its own schema.
 * Anything a test passes on top is an override, so a test cannot accidentally exercise a prop set no
 * document could produce.
 */
export function renderBlock<P>(
  definition: BlockDefinition<P>,
  Component: ComponentType<P & { children?: ReactNode }>,
  overrides: Partial<P> & { children?: ReactNode } = {},
): RenderResult {
  const props = definition.propsSchema.parse({ ...definition.defaults, ...overrides })

  return render(<Component {...props} {...overrides} />)
}

/** Two page-level rules off, for the same reason as the `ui` helper: a fragment is not a page. */
const PAGE_LEVEL_RULES = {
  region: { enabled: false },
  'page-has-heading-one': { enabled: false },
} as const

export async function expectNoViolations(element: Element): Promise<void> {
  expect(await axe(element, { rules: PAGE_LEVEL_RULES })).toHaveNoViolations()
}
