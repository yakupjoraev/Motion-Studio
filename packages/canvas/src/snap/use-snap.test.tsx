import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { canvasRect } from '../coords/index'
import { box, rect } from '../test/snap'
import { type ViewportHandle, useViewport } from '../viewport/use-viewport'

import { DistanceLabels } from './guides/distance-labels'
import { GAP_VARS, SNAP_VARS } from './guides/paint-guides'
import { SnapGuides } from './guides/snap-guides'
import { type SnapHandle, useSnap } from './use-snap'

interface Mounted {
  readonly snap: SnapHandle
  readonly viewport: ViewportHandle
}

function mount(zoom = 1): Mounted {
  let handles: Mounted | null = null

  function Harness() {
    const viewport = useViewport({ initial: { zoom, pan: { x: 0, y: 0 } } })
    const snap = useSnap({ viewport })

    handles = { snap, viewport }

    return (
      <div ref={viewport.rootRef}>
        <SnapGuides overlay={snap.overlay} />
        <DistanceLabels overlay={snap.overlay} />
      </div>
    )
  }

  render(<Harness />)

  if (handles === null) {
    throw new Error('the hook did not run')
  }

  return handles
}

const frames = (): void => {
  act(() => {
    vi.advanceTimersToNextFrame()
  })
}

const lineX = (): HTMLElement => screen.getByTestId('snap-guide-x')
const bar = (index: number): HTMLElement => screen.getByTestId(`snap-gap-gap-${index}`)

/** Three siblings in a row with a 100-wide opening between each pair. */
const siblings = [box('a', 0, 0, 100, 60), box('b', 200, 0, 100, 60), box('c', 400, 0, 100, 60)]

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSnap', () => {
  it('shows a guide on the frame the snap engages', () => {
    const { snap } = mount()

    act(() => {
      snap.begin({ moving: rect(0, 0, 50, 50), siblings })
    })

    expect(lineX()).not.toHaveAttribute('data-active')

    let delta = { x: 0, y: 0 }

    act(() => {
      delta = snap.move(rect(197, 0, 50, 50)).delta
    })
    frames()

    expect(delta.x).toBe(3)
    expect(lineX()).toHaveAttribute('data-active')
    expect(lineX().style.getPropertyValue(SNAP_VARS.pos)).toBe('200px')
  })

  it('bounds the line to the aligned edges plus the overhang', () => {
    const { snap } = mount()

    act(() => {
      snap.begin({ moving: rect(0, 0, 50, 50), siblings })
      snap.move(rect(197, 0, 50, 50))
    })
    frames()

    // The sibling spans y 0–60 and the moving box 0–50, so the union is 60 plus 24 either side.
    expect(lineX().style.getPropertyValue(SNAP_VARS.start)).toBe('-24px')
    expect(lineX().style.getPropertyValue(SNAP_VARS.size)).toBe('108px')
  })

  it('dashes a centre alignment and leaves an edge solid', () => {
    const { snap } = mount()

    act(() => {
      snap.begin({ moving: rect(0, 0, 50, 50), siblings })
      snap.move(rect(197, 0, 50, 50))
    })
    frames()

    expect(lineX()).toHaveAttribute('data-dashed', 'false')

    act(() => {
      // Sibling `b` is 200–300, so its centre-x is 250.
      snap.move(rect(248, 0, 50, 50))
    })
    frames()

    expect(lineX()).toHaveAttribute('data-dashed', 'true')
  })

  it('measures the two gaps of a spacing snap and draws no line for it', () => {
    const { snap } = mount()

    act(() => {
      snap.begin({ moving: rect(0, 0, 60, 60), siblings })
      // The opening is 100–200 and the box is 60, so the equalising position is 120 with 20 either
      // side; y aligns exactly, which is the guide the other axis draws.
      snap.move(rect(122, 0, 60, 60))
    })
    frames()

    expect(lineX()).not.toHaveAttribute('data-active')
    expect(bar(0)).toHaveAttribute('data-active')
    expect(bar(0).style.getPropertyValue(GAP_VARS.x)).toBe('100px')
    expect(bar(0).style.getPropertyValue(GAP_VARS.width)).toBe('20px')
    expect(bar(0).textContent).toBe('20')
    expect(bar(1).style.getPropertyValue(GAP_VARS.x)).toBe('180px')
    expect(bar(2)).not.toHaveAttribute('data-active')
  })

  it('scales the painted geometry by the zoom', () => {
    const { snap } = mount(2)

    act(() => {
      snap.begin({ moving: rect(0, 0, 50, 50), siblings })
      snap.move(rect(199, 0, 50, 50))
    })
    frames()

    expect(lineX().style.getPropertyValue(SNAP_VARS.pos)).toBe('400px')
  })

  it('converts the threshold by the zoom, so it engages at the same screen distance', () => {
    const zoomed = mount(4)

    act(() => {
      zoomed.snap.begin({ moving: rect(0, 0, 50, 50), siblings })
    })

    // 4 screen px at zoom 4 is one canvas unit: 1 away snaps, 2 away does not.
    expect(zoomed.snap.move(rect(199, 0, 50, 50)).delta.x).toBe(1)
    expect(zoomed.snap.move(rect(198, 0, 50, 50)).delta.x).toBe(0)
  })

  it('paints once per frame however many moves arrive', () => {
    const { snap } = mount()

    act(() => {
      snap.begin({ moving: rect(0, 0, 50, 50), siblings })
    })

    const writes = vi.spyOn(lineX().style, 'setProperty')

    act(() => {
      for (let step = 0; step < 20; step += 1) {
        snap.move(rect(197, 0, 50, 50))
      }
    })

    expect(writes).not.toHaveBeenCalled()

    frames()

    // Three properties, written once: position, start and size.
    expect(writes).toHaveBeenCalledTimes(3)
  })

  describe('the modifier', () => {
    it('snaps nothing when it is already held at the start of the drag', () => {
      const { snap } = mount()

      act(() => {
        snap.begin({ moving: rect(0, 0, 50, 50), siblings }, { metaKey: true, ctrlKey: false })
      })

      expect(snap.move(rect(197, 0, 50, 50)).delta.x).toBe(0)
    })

    it('drops the guides the moment it goes down mid-drag, without a pointer move', () => {
      const { snap } = mount()

      act(() => {
        snap.begin({ moving: rect(0, 0, 50, 50), siblings })
        snap.move(rect(197, 0, 50, 50))
      })
      frames()

      expect(lineX()).toHaveAttribute('data-active')

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', metaKey: true }))
      })
      frames()

      expect(lineX()).not.toHaveAttribute('data-active')
      expect(snap.move(rect(197, 0, 50, 50)).delta.x).toBe(0)
    })

    it('snaps again when it comes back up', () => {
      const { snap } = mount()

      act(() => {
        snap.begin({ moving: rect(0, 0, 50, 50), siblings }, { metaKey: true, ctrlKey: false })
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Meta', metaKey: false }))
      })

      expect(snap.move(rect(197, 0, 50, 50)).delta.x).toBe(3)
    })

    it('ignores keys once the gesture is over', () => {
      const { snap } = mount()

      act(() => {
        snap.begin({ moving: rect(0, 0, 50, 50), siblings })
        snap.end()
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', metaKey: true }))
      })

      expect(snap.move(rect(197, 0, 50, 50)).delta.x).toBe(0)
    })
  })

  it('clears every overlay on drop', () => {
    const { snap } = mount()

    act(() => {
      snap.begin({ moving: rect(0, 0, 60, 60), siblings })
      snap.move(rect(122, 0, 60, 60))
    })
    frames()

    act(() => {
      snap.end()
    })

    expect(lineX()).not.toHaveAttribute('data-active')
    expect(bar(0)).not.toHaveAttribute('data-active')
  })

  it('takes the store settings: a wider threshold, and the engine switched off', () => {
    const held: { current: SnapHandle | null } = { current: null }

    function Harness({ enabled }: { readonly enabled: boolean }) {
      const viewport = useViewport()

      held.current = useSnap({ viewport, thresholdPx: 20, enabled })

      return <div ref={viewport.rootRef} />
    }

    const view = render(<Harness enabled />)

    act(() => {
      held.current?.begin({ moving: canvasRect({ x: 0, y: 0, width: 50, height: 50 }), siblings })
    })

    // 20 px of threshold reaches sibling `b`'s left edge from the moving box's centre, 10 away.
    expect(held.current?.move(rect(185, 0, 50, 50)).delta.x).toBe(-10)

    view.rerender(<Harness enabled={false} />)

    expect(held.current?.move(rect(185, 0, 50, 50)).delta.x).toBe(0)
  })
})
