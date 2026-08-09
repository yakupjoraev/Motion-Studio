import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Divider } from './divider'
import { dividerDefinition } from './divider.definition'
import { DIVIDER_LABEL_MAX, DIVIDER_STYLES } from './divider.schema'

const definition = dividerDefinition

describe('Divider', () => {
  it('is an <hr> when it has no label', () => {
    const { container } = renderBlock(definition, Divider)

    expect(container.querySelector('hr')).not.toBeNull()
    expect(screen.queryByRole('separator')).toBe(container.querySelector('hr'))
  })

  it('is a named separator when it has one', () => {
    renderBlock(definition, Divider, { label: 'or' })

    const separator = screen.getByRole('separator', { name: 'or' })

    expect(separator.tagName).toBe('DIV')
    expect(separator).toHaveTextContent('or')
  })

  it('fades from both ends only when asked', () => {
    const { container } = renderBlock(definition, Divider, { label: 'or', fade: true })
    const rule = container.querySelector('[aria-hidden]')

    expect(rule?.className).toContain('bg-gradient-to-r')
  })

  it('has a class for every line style', () => {
    for (const lineStyle of DIVIDER_STYLES) {
      const { container, unmount } = renderBlock(definition, Divider, { lineStyle })

      expect(container.querySelector('hr')?.className, lineStyle).toContain(`border-${lineStyle}`)
      unmount()
    }
  })

  it('refuses a label longer than its control allows', () => {
    expect(() =>
      definition.propsSchema.parse({ label: 'x'.repeat(DIVIDER_LABEL_MAX + 1) }),
    ).toThrow()
  })

  it('has no axe violations in either form', async () => {
    const plain = renderBlock(definition, Divider)

    await expectNoViolations(plain.container)
    plain.unmount()

    const labelled = renderBlock(definition, Divider, { label: 'or' })

    await expectNoViolations(labelled.container)
  })
})
