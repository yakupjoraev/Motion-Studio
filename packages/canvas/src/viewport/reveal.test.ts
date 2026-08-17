import { describe, expect, it } from 'vitest'

import { FIT_PADDING } from '../coords/index'
import type { ViewportRect } from '../coords/index'

import { revealPan } from './reveal'

const VIEWPORT: ViewportRect = { left: 100, top: 50, width: 1000, height: 800 }

describe('revealPan', () => {
  it('moves nothing when the box is already inside the padded viewport', () => {
    const rect = { x: 300, y: 200, width: 200, height: 100 }

    expect(revealPan(rect, VIEWPORT, FIT_PADDING)).toEqual({ dx: 0, dy: 0 })
  })

  it('pulls a box that is off the left and top edges to the padding line', () => {
    const rect = { x: 40, y: 10, width: 200, height: 100 }

    // 100 + 64 - 40 = 124 to the right, 50 + 64 - 10 = 104 down.
    expect(revealPan(rect, VIEWPORT, FIT_PADDING)).toEqual({ dx: 124, dy: 104 })
  })

  it('pulls a box that is off the right and bottom edges back by the overshoot', () => {
    const rect = { x: 1000, y: 800, width: 200, height: 100 }

    // Far edges are 1036 and 786; the box ends at 1200 and 900.
    expect(revealPan(rect, VIEWPORT, FIT_PADDING)).toEqual({ dx: -164, dy: -114 })
  })

  it('shows the near edge of a box larger than the viewport', () => {
    const rect = { x: 300, y: 200, width: 4000, height: 3000 }

    // Both far-edge corrections would push the start further out of view, so the near edge wins.
    expect(revealPan(rect, VIEWPORT, FIT_PADDING)).toEqual({ dx: -136, dy: -86 })
  })

  it('reads padding as a parameter, so a caller with no chrome can ask for none', () => {
    const rect = { x: 60, y: 20, width: 100, height: 40 }

    expect(revealPan(rect, VIEWPORT, 0)).toEqual({ dx: 40, dy: 30 })
  })
})
