import { describe, expect, it } from 'vitest'

import { canvasRect } from '../coords/index'

import {
  CHIP_HEIGHT_PX,
  HANDLE_MIN_ZOOM,
  handlesVisible,
  shouldFlipChip,
  unionRect,
  writeBox,
  writeSpacing,
} from './overlay-box'
import { OVERLAY_VARS, SPACING_VARS } from './overlay.styles'

const rect = (x: number, y: number, width: number, height: number) =>
  canvasRect({ x, y, width, height })

const IDENTITY = { zoom: 1, pan: { x: 0, y: 0 } }

describe('writeBox', () => {
  it('writes the box in canvas units and turns the element on', () => {
    const element = document.createElement('div')

    expect(writeBox(element, rect(10, 20, 30, 40))).toBe(true)
    expect(element.style.getPropertyValue(OVERLAY_VARS.x)).toBe('10px')
    expect(element.style.getPropertyValue(OVERLAY_VARS.y)).toBe('20px')
    expect(element.style.getPropertyValue(OVERLAY_VARS.width)).toBe('30px')
    expect(element.style.getPropertyValue(OVERLAY_VARS.height)).toBe('40px')
    expect(element).toHaveAttribute('data-active', 'true')
  })

  it('turns the element off when the node has no measurement', () => {
    const element = document.createElement('div')

    writeBox(element, rect(0, 0, 1, 1))

    expect(writeBox(element, undefined)).toBe(false)
    expect(element).not.toHaveAttribute('data-active')
  })

  it('survives an element that is not mounted yet', () => {
    expect(writeBox(null, rect(0, 0, 1, 1))).toBe(false)
  })
})

describe('writeSpacing', () => {
  it('writes all eight sides', () => {
    const element = document.createElement('div')

    writeSpacing(element, {
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
      margin: { top: 5, right: 6, bottom: 7, left: 8 },
    })

    expect(element.style.getPropertyValue(SPACING_VARS.padding.top)).toBe('1px')
    expect(element.style.getPropertyValue(SPACING_VARS.padding.left)).toBe('4px')
    expect(element.style.getPropertyValue(SPACING_VARS.margin.bottom)).toBe('7px')
  })
})

describe('shouldFlipChip', () => {
  it('flips when the box top is within the chip height of the viewport top', () => {
    expect(shouldFlipChip(rect(0, CHIP_HEIGHT_PX - 1, 10, 10), IDENTITY)).toBe(true)
    expect(shouldFlipChip(rect(0, CHIP_HEIGHT_PX, 10, 10), IDENTITY)).toBe(false)
  })

  it('asks the question in screen space, so a pan is what decides it', () => {
    const box = rect(0, 200, 10, 10)

    expect(shouldFlipChip(box, IDENTITY)).toBe(false)
    expect(shouldFlipChip(box, { zoom: 1, pan: { x: 0, y: -190 } })).toBe(true)
  })

  it('takes the zoom into account: the same node flips when it is scaled up the viewport', () => {
    const box = rect(0, 10, 10, 10)

    expect(shouldFlipChip(box, { zoom: 4, pan: { x: 0, y: 0 } })).toBe(false)
    expect(shouldFlipChip(box, { zoom: 0.25, pan: { x: 0, y: 0 } })).toBe(true)
  })
})

describe('handlesVisible', () => {
  it('draws handles at the floor and above it, and none below', () => {
    expect(handlesVisible(HANDLE_MIN_ZOOM)).toBe(true)
    expect(handlesVisible(HANDLE_MIN_ZOOM - 0.01)).toBe(false)
    expect(handlesVisible(4)).toBe(true)
  })
})

describe('unionRect', () => {
  it('covers every rect it is given', () => {
    expect(unionRect([rect(10, 10, 20, 20), rect(50, 0, 10, 100)])).toMatchObject({
      x: 10,
      y: 0,
      width: 50,
      height: 100,
    })
  })

  it('returns a nested rect as itself', () => {
    expect(unionRect([rect(0, 0, 100, 100), rect(10, 10, 10, 10)])).toMatchObject({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })
  })

  it('has nothing to draw for an empty selection', () => {
    expect(unionRect([])).toBeUndefined()
  })
})
