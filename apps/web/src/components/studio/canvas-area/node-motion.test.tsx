import type { MotionChannel, MotionSpec } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MotionSettingsProvider } from './motion-settings'
import { NodeMotion, type NodeMotionSpecs } from './node-motion'

const entrance: MotionSpec = {
  presetId: 'fade-up',
  channel: 'entrance',
  trigger: { kind: 'inView', amount: 0.3, once: true, margin: '0px' },
  params: { distance: 16 },
}

const mount = (motion: NodeMotionSpecs) =>
  render(
    <MotionSettingsProvider>
      <NodeMotion motion={motion}>
        <p data-testid="block">Block</p>
      </NodeMotion>
    </MotionSettingsProvider>,
  )

const wrapperOf = (element: HTMLElement): HTMLElement | null => element.parentElement

describe('NodeMotion', () => {
  it('renders the block unwrapped when the node animates nothing', () => {
    const { container } = mount({})

    expect(wrapperOf(screen.getByTestId('block'))).toBe(container)
  })

  it('wraps a node that carries a spec, and starts it at the hidden variant', () => {
    mount({ entrance })

    const wrapper = wrapperOf(screen.getByTestId('block'))

    expect(wrapper).not.toBeNull()
    expect(wrapper?.style.opacity).toBe('0')
    expect(wrapper?.style.transform).toContain('16px')
  })

  // A channel switched off in the panel is still stored, and a stored-but-off channel is not motion.
  it('leaves a node whose only channel is disabled unwrapped', () => {
    const off: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
      entrance: { ...entrance, disabled: true },
    }
    const { container } = mount(off)

    expect(wrapperOf(screen.getByTestId('block'))).toBe(container)
  })
})
