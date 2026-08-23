import { render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'

import { markupRegistry } from '../markup-registry'
import { DEFINITIONS } from '../registry'
import { renderRegistry } from '../render-registry'

import { normaliseMarkup } from './markup-parity'
import { renderMarkupNode } from './render-markup'

/**
 * ADR-249's safety net. For every block that has a markup producer: render the real component with its
 * own preview props, render the producer's output with the same props, and compare normalised DOM.
 *
 * This is the test that makes "the block's markup is written twice" survivable. Without it the
 * declarative alternative would have been the better decision.
 */
const withProducer = DEFINITIONS.filter(
  (definition) => markupRegistry[String(definition.id)] !== undefined,
)

describe('markup parity', () => {
  it('has a producer for every id it names, and names only real ids', () => {
    const ids = new Set(DEFINITIONS.map((definition) => String(definition.id)))

    for (const id of Object.keys(markupRegistry)) {
      expect(ids.has(id)).toBe(true)
    }
  })

  it('covers the whole layout category, which is where the mechanism landed', () => {
    const layout = DEFINITIONS.filter((definition) => definition.category === 'layout').map(
      (definition) => String(definition.id),
    )

    for (const id of layout) {
      expect(Object.keys(markupRegistry)).toContain(id)
    }
  })

  describe.each(withProducer.map((definition) => [String(definition.id), definition] as const))(
    '%s',
    (id, definition) => {
      it('produces the DOM its own component renders', () => {
        const producer = markupRegistry[id]
        const Component = renderRegistry[id] as ComponentType<Record<string, unknown>>

        expect(producer).toBeDefined()
        expect(Component).toBeDefined()

        const props = definition.propsSchema.parse(definition.previewProps) as Record<
          string,
          unknown
        >
        const component = render(<Component {...props} />)
        const produced = producer?.({ props }) ?? { kind: 'text' as const, value: '' }
        const markup = render(renderMarkupNode(produced, props))

        expect(normaliseMarkup(markup.container.firstElementChild as Element)).toBe(
          normaliseMarkup(component.container.firstElementChild as Element),
        )
      })
    },
  )
})
