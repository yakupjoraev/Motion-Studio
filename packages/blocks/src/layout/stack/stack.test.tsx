import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Stack } from './stack'
import { stackDefinition } from './stack.definition'

const definition = stackDefinition

describe('Stack', () => {
  it('renders its children in a column by default', () => {
    const { container } = renderBlock(definition, Stack, { children: <span>Child</span> })

    expect(screen.getByText('Child')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain('flex-col')
  })

  it('takes the divider from the direction it is laid out in', () => {
    const vertical = renderBlock(definition, Stack, { divider: true })

    expect(vertical.container.firstElementChild?.className).toContain('divide-y')
    vertical.unmount()

    const horizontal = renderBlock(definition, Stack, { divider: true, direction: 'horizontal' })

    expect(horizontal.container.firstElementChild?.className).toContain('divide-x')
  })

  it('hides itself when the prop says so — ADR-117', () => {
    const { container } = renderBlock(definition, Stack, { hidden: true })

    expect(container.firstElementChild?.className).toContain('hidden')
  })

  it('renders every layout mode without throwing', () => {
    for (const direction of ['vertical', 'horizontal'] as const) {
      for (const justify of ['start', 'center', 'end', 'between'] as const) {
        const { unmount } = renderBlock(definition, Stack, { direction, justify })

        unmount()
      }
    }
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Stack, { children: <p>Body</p> })

    await expectNoViolations(container)
  })
})
