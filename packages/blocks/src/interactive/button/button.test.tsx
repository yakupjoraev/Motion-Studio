import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Button } from './button'
import { buttonDefinition as definition } from './button.definition'

describe('Button', () => {
  it('is a button with no href, and a link with one', () => {
    renderBlock(definition, Button)

    expect(screen.getByRole('button', { name: definition.defaults.label })).toBeInTheDocument()

    renderBlock(definition, Button, { href: '#pricing' })

    expect(screen.getByRole('link', { name: definition.defaults.label })).toHaveAttribute(
      'href',
      '#pricing',
    )
  })

  it('names itself from the label, not from its glyphs', () => {
    renderBlock(definition, Button, { leadingIcon: 'check', trailingIcon: 'chevron-right' })

    const control = screen.getByRole('button')

    expect(control).toHaveAccessibleName(definition.defaults.label)
    for (const glyph of control.querySelectorAll('svg')) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('draws nothing for an icon name the registry does not know', () => {
    renderBlock(definition, Button, { leadingIcon: 'not-an-icon' })

    expect(screen.getByRole('button').querySelector('svg')).toBeNull()
  })

  describe('the busy state', () => {
    it('announces itself beside the label rather than replacing it', () => {
      renderBlock(definition, Button, { loading: true, label: 'Saving', loadingLabel: 'Loading' })

      const control = screen.getByRole('button')

      expect(control).toHaveAttribute('aria-busy', 'true')
      expect(control).toHaveAccessibleName('Saving Loading')
    })

    /*
     * ADR-appropriate distinction rather than a style choice: `disabled` would take the control out of the
     * focus order, so a keyboard user could never reach it to hear that it is busy.
     */
    it('stays reachable, because a disabled control cannot be heard', () => {
      renderBlock(definition, Button, { loading: true })

      const control = screen.getByRole('button')

      expect(control).toHaveAttribute('aria-disabled', 'true')
      expect(control).not.toBeDisabled()
    })

    it('swaps the leading glyph for the spinner and drops the trailing one', () => {
      renderBlock(definition, Button, {
        loading: true,
        leadingIcon: 'check',
        trailingIcon: 'chevron-right',
      })

      const glyphs = screen.getByRole('button').querySelectorAll('svg')

      expect(glyphs).toHaveLength(1)
      expect(glyphs[0]?.getAttribute('class')).toContain('ms-spin')
    })

    it('says nothing about being busy when it is not', () => {
      renderBlock(definition, Button)

      const control = screen.getByRole('button')

      expect(control).not.toHaveAttribute('aria-busy')
      expect(control).not.toHaveAttribute('aria-disabled')
    })
  })

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'paints the %s variant from tokens',
    (variant) => {
      renderBlock(definition, Button, { variant })

      expect(screen.getByRole('button').className).not.toMatch(/#|rgb\(|oklch\(/)
    },
  )

  it.each([
    ['sm', 'h-10'],
    ['md', 'h-12'],
    ['lg', 'h-14'],
  ] as const)('gives %s the content-density row height %s', (size, height) => {
    renderBlock(definition, Button, { size })

    expect(screen.getByRole('button').className).toContain(height)
  })

  it('carries the responsive visibility class on the control itself', () => {
    renderBlock(definition, Button, { hidden: true })

    expect(screen.getByRole('button', { hidden: true }).className).toContain('hidden')
  })

  it('validates its own defaults', () => {
    expect(() => definition.propsSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations, busy or idle', async () => {
    const idle = renderBlock(definition, Button)

    await expectNoViolations(idle.container)

    const busy = renderBlock(definition, Button, { loading: true })

    await expectNoViolations(busy.container)
  })
})
