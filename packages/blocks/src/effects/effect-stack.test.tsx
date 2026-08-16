import { effectId } from '@motion-studio/schema'
import type { EffectInstance } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { blockRegistry } from '../registry'

import { EffectStack } from './effect-stack'

const instance = (
  partial: Partial<EffectInstance> & Pick<EffectInstance, 'id'>,
): EffectInstance => ({
  effectId: effectId('dot-grid'),
  params: {},
  layer: 'behind',
  blendMode: 'normal',
  opacity: 1,
  ...partial,
})

const stack = (effects: readonly EffectInstance[]) =>
  render(<EffectStack effects={effects} registry={blockRegistry} />)

describe('EffectStack', () => {
  it('renders nothing when the node carries no effects', () => {
    const { container } = stack([])

    expect(container.firstChild).toBeNull()
  })

  it('keeps document order, which is the stacking order', () => {
    stack([
      instance({ id: 'fx_1', effectId: effectId('dot-grid') }),
      instance({ id: 'fx_2', effectId: effectId('grid-lines') }),
      instance({ id: 'fx_3', effectId: effectId('glow') }),
    ])

    expect(screen.getAllByTestId('effect-layer').map((layer) => layer.dataset['effect'])).toEqual([
      'dot-grid',
      'grid-lines',
      'glow',
    ])
  })

  it('puts a behind layer under the content and a front layer over it', () => {
    stack([
      instance({ id: 'fx_1', layer: 'behind' }),
      instance({ id: 'fx_2', layer: 'front', effectId: effectId('shine') }),
    ])

    const [behind, front] = screen.getAllByTestId('effect-layer')

    expect(behind?.className).toContain('-z-10')
    expect(front?.className).toContain('z-10')
  })

  it('composites from the instance, not from the effect', () => {
    stack([instance({ id: 'fx_1', blendMode: 'screen', opacity: 0.4 })])

    const layer = screen.getByTestId('effect-layer')

    expect(layer.style.mixBlendMode).toBe('screen')
    expect(layer.style.opacity).toBe('0.4')
  })

  it('falls back to the effect defaults when params do not parse (ADR-149)', () => {
    stack([instance({ id: 'fx_1', params: { spacing: 'not a number' } })])

    // The layer is still there: a decorative layer never takes the node down with it.
    expect(screen.getByTestId('dot-grid').style.getPropertyValue('--ms-fx-size')).toBe('24px')
  })

  it('skips an effect the registry does not know', () => {
    stack([instance({ id: 'fx_1', effectId: effectId('not-an-effect') })])

    expect(screen.queryAllByTestId('effect-layer')).toHaveLength(0)
  })

  it('is transparent to the pointer at every level', () => {
    stack([instance({ id: 'fx_1' })])

    expect(screen.getByTestId('effect-layer').className).toContain('pointer-events-none')
    expect(screen.getByTestId('dot-grid').className).toContain('pointer-events-none')
  })
})
