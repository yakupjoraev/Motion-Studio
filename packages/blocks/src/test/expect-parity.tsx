import type { MarkupChild } from '@motion-studio/schema'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { expect } from 'vitest'

import { normaliseMarkup } from './markup-parity'
import { renderMarkupNode } from './render-markup'

/**
 * The rule ADR-249 holds a block to, applied to the subcomponents blocks share: the producer's DOM is
 * the component's DOM. They are checked directly rather than only through the blocks that call them,
 * because `marketing-section` is eight blocks and `hero-copy` is six — a difference found here is
 * found once.
 */
const domOf = (element: Element | null): string =>
  element === null ? '' : normaliseMarkup(element)

export function expectParity(produced: MarkupChild | null, component: ReactElement): void {
  const markup = render(produced === null ? null : renderMarkupNode(produced, {}))
  const rendered = render(component)

  expect(domOf(markup.container.firstElementChild)).toBe(
    domOf(rendered.container.firstElementChild),
  )
}
