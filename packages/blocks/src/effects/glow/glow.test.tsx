import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Glow } from './glow'
import { glowDefinition } from './glow.definition'
import { GLOW_ORIGINS } from './glow.schema'

const definition = glowDefinition

describe('Glow', () => {
  it('moves the gradient origin rather than the layer', () => {
    for (const origin of GLOW_ORIGINS) {
      const { unmount } = renderBlock(definition, Glow, { origin })

      expect(screen.getByTestId('glow').style.getPropertyValue('--ms-fx-origin'), origin).not.toBe(
        '',
      )
      expect(screen.getByTestId('glow-field').style.left).toBe('')
      unmount()
    }
  })

  it('breathes only when asked', () => {
    renderBlock(definition, Glow, { breathe: false })
    expect(screen.getByTestId('glow-field').className).not.toContain('ms-fx-breathe')

    const { unmount } = renderBlock(definition, Glow, { breathe: true })
    expect(screen.getAllByTestId('glow-field').at(-1)?.className).toContain('ms-fx-breathe')
    unmount()
  })

  it('is off by default, because a pulsing section holds the eye', () => {
    expect(definition.defaults.breathe).toBe(false)
  })

  it('has no axe violations', async () => {
    await expectNoViolations(renderBlock(definition, Glow).container)
  })
})
