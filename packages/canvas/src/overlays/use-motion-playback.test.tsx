import { fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { CanvasMotionPort } from '../canvas.types'

import { MOTION_PAUSED_ATTRIBUTE, useMotionPlayback } from './use-motion-playback'

const fakeMotion = (initial = false): CanvasMotionPort => {
  let paused = initial

  return {
    paused: () => paused,
    setPaused: vi.fn((next: boolean) => {
      paused = next
    }),
    replay: vi.fn(),
  }
}

function Fixture({ motion }: { readonly motion: CanvasMotionPort | undefined }) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useMotionPlayback({ rootRef, motion })

  return <div data-testid="root" ref={rootRef} />
}

const mount = (motion: CanvasMotionPort | undefined) => {
  const view = render(<Fixture motion={motion} />)
  const root = view.getByTestId('root')

  return {
    root,
    press: (key: string, shiftKey = false) =>
      fireEvent.keyDown(root, { key, ctrlKey: true, shiftKey }),
  }
}

describe('useMotionPlayback', () => {
  it('toggles the flag on Mod+P and reflects it on the canvas root', () => {
    const motion = fakeMotion()
    const { root, press } = mount(motion)

    press('p')

    expect(motion.setPaused).toHaveBeenCalledWith(true)
    expect(root).toHaveAttribute(MOTION_PAUSED_ATTRIBUTE, 'true')

    press('p')

    expect(motion.setPaused).toHaveBeenLastCalledWith(false)
    expect(root).not.toHaveAttribute(MOTION_PAUSED_ATTRIBUTE)
  })

  it('replays the entrances on Mod+Shift+P without touching the flag', () => {
    const motion = fakeMotion()
    const { press } = mount(motion)

    press('p', true)

    expect(motion.replay).toHaveBeenCalledTimes(1)
    expect(motion.setPaused).not.toHaveBeenCalled()
  })

  it('starts from the state the store is already in', () => {
    const { root } = mount(fakeMotion(true))

    expect(root).toHaveAttribute(MOTION_PAUSED_ATTRIBUTE, 'true')
  })

  it('leaves a bare P to whatever else wants it', () => {
    const motion = fakeMotion()
    const { root } = mount(motion)

    fireEvent.keyDown(root, { key: 'p' })

    expect(motion.setPaused).not.toHaveBeenCalled()
  })

  it('does nothing at all without a port', () => {
    const { press, root } = mount(undefined)

    expect(() => press('p')).not.toThrow()
    expect(root).not.toHaveAttribute(MOTION_PAUSED_ATTRIBUTE)
  })
})
