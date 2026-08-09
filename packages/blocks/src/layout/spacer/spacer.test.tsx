import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Spacer } from './spacer'
import { spacerDefinition } from './spacer.definition'
import { SPACER_HEIGHTS } from './spacer.schema'

const definition = spacerDefinition

describe('Spacer', () => {
  it('is a fixed height by default', () => {
    const { container } = renderBlock(definition, Spacer)

    expect(container.firstElementChild?.className).toContain('h-8')
    expect(container.firstElementChild?.className).not.toContain('flex-1')
  })

  it('fills what is left in fluid mode', () => {
    const { container } = renderBlock(definition, Spacer, { mode: 'fluid' })

    expect(container.firstElementChild?.className).toContain('flex-1')
  })

  it('renders inside a non-flex parent without throwing — ADR-115 hints instead', () => {
    const { container } = render(
      <div className="block">
        <Spacer {...definition.propsSchema.parse({ mode: 'fluid' })} />
      </div>,
    )

    // It does nothing here, which is why the block declares the requirement and the inspector says so.
    expect(definition.capabilities.requiresFlexParent).toBe(true)
    expect(container.querySelector('div > div')).not.toBeNull()
  })

  it('has a class for every height', () => {
    for (const height of SPACER_HEIGHTS) {
      const { container, unmount } = renderBlock(definition, Spacer, { height })

      expect(container.firstElementChild?.className, height).toMatch(/h-\d+/)
      unmount()
    }
  })

  it('is hidden from assistive technology', () => {
    const { container } = renderBlock(definition, Spacer)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Spacer)

    await expectNoViolations(container)
  })
})
