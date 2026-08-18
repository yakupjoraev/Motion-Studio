import { MotionSchedulerProvider } from '@motion-studio/motion'
import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Profiler, act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { Dock } from './dock'
import { dockDefinition as definition } from './dock.definition'
import { dockScale, nextDockIndex } from './dock.schema'
import { DOCK_POINTER_VARIABLE } from './use-dock-magnify'

const items = definition.defaults.items

/*
 * jsdom lays nothing out, and the hook measures a row. The geometry below is the row the block really
 * draws — a 12 px tray padding, 44 px items, 8 px gaps, starting at x = 100 — installed on the prototype
 * *before* the render, because the hook takes its measurements when it subscribes.
 */
const TRAY_LEFT = 100
const TRAY_PADDING = 12
const ITEM_SIZE = 44
const ITEM_GAP = 8

const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect

/** Where the centre of item `index` lands, in page coordinates. */
const centreOf = (index: number): number =>
  TRAY_LEFT + TRAY_PADDING + index * (ITEM_SIZE + ITEM_GAP) + ITEM_SIZE / 2

const original = Element.prototype.getBoundingClientRect

const layOutDock = (): void => {
  Element.prototype.getBoundingClientRect = function measured(this: Element): DOMRect {
    if (this.matches('[data-testid="dock"]')) {
      return rect(TRAY_LEFT, 500, TRAY_PADDING * 2 + items.length * (ITEM_SIZE + ITEM_GAP), 68)
    }

    if (this.matches('[data-dock-item]')) {
      const row = this.parentElement
      const index =
        row?.parentElement === null || row?.parentElement === undefined
          ? 0
          : [...row.parentElement.children].indexOf(row)

      return rect(centreOf(index) - ITEM_SIZE / 2, 512, ITEM_SIZE, ITEM_SIZE)
    }

    return original.call(this)
  }
}

afterEach(() => {
  Element.prototype.getBoundingClientRect = original
})

/**
 * One pointer move, delivered the way a browser delivers it: the bus asks for a frame, the frame arrives
 * afterwards. Running the callback *inside* `requestAnimationFrame` instead would let the bus store a
 * handle for a frame that had already run, and every move after the first would be dropped.
 */
const pointerAt = (x: number, y: number): void => {
  let queued: FrameRequestCallback | null = null

  const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    queued = callback

    return 1
  })

  fireEvent(document, new MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true }))
  raf.mockRestore()

  act(() => {
    queued?.(0)
  })
}

const pointerOf = (item: Element): number =>
  Number.parseFloat((item as HTMLElement).style.getPropertyValue(DOCK_POINTER_VARIABLE) || '1')

const renderWithScheduler = (): void => {
  const props = definition.propsSchema.parse(definition.defaults)

  layOutDock()

  render(
    <MotionSchedulerProvider>
      <Dock {...props} />
    </MotionSchedulerProvider>,
  )
}

describe('dockScale', () => {
  it('peaks at the cursor and is exactly 1 beyond the reach', () => {
    expect(dockScale(0, 100, 1.5)).toBeCloseTo(1.5, 5)
    expect(dockScale(100, 100, 1.5)).toBe(1)
    expect(dockScale(-260, 100, 1.5)).toBe(1)
  })

  it('is symmetric and falls away monotonically', () => {
    expect(dockScale(30, 100, 1.5)).toBeCloseTo(dockScale(-30, 100, 1.5), 5)
    expect(dockScale(30, 100, 1.5)).toBeGreaterThan(dockScale(60, 100, 1.5))
  })

  it('eases rather than ramping, so the row is a wave and not a triangle', () => {
    // A linear falloff would put the halfway distance at exactly halfway up the peak.
    expect(dockScale(50, 100, 2)).toBeCloseTo(1.5, 5)
    expect(dockScale(25, 100, 2)).toBeGreaterThan(1.75)
  })

  it('answers 1 for a reach of nothing rather than dividing by it', () => {
    expect(dockScale(10, 0, 1.5)).toBe(1)
  })
})

describe('nextDockIndex', () => {
  it('wraps in both directions and jumps to the ends', () => {
    expect(nextDockIndex('ArrowRight', 5, 6)).toBe(0)
    expect(nextDockIndex('ArrowLeft', 0, 6)).toBe(5)
    expect(nextDockIndex('Home', 3, 6)).toBe(0)
    expect(nextDockIndex('End', 3, 6)).toBe(5)
  })

  it('leaves every other key alone', () => {
    expect(nextDockIndex('Tab', 2, 6)).toBeNull()
    expect(nextDockIndex('ArrowDown', 2, 6)).toBeNull()
    expect(nextDockIndex('ArrowRight', 0, 0)).toBeNull()
  })
})

describe('Dock', () => {
  it('is one labelled navigation landmark holding a list', () => {
    renderBlock(definition, Dock)

    const landmarks = screen.getAllByRole('navigation')

    expect(landmarks).toHaveLength(1)
    expect(landmarks[0]).toHaveAccessibleName(definition.defaults.ariaLabel)
    expect(screen.getAllByTestId('dock-item')).toHaveLength(items.length)
  })

  it('names every item after what it does, with the glyph hidden', () => {
    const { container } = renderBlock(definition, Dock)

    for (const item of items) {
      expect(screen.getByRole('link', { name: item.label })).toBeInTheDocument()
    }

    for (const glyph of container.querySelectorAll('svg')) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('renders an item with no href as a button', () => {
    renderBlock(definition, Dock, { items: [{ label: 'Toggle', href: '', icon: 'grid' }] })

    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument()
  })

  it('swells the item under the cursor and leaves the far ones alone', () => {
    renderWithScheduler()

    pointerAt(centreOf(0), 530)

    const drawn = screen.getAllByTestId('dock-item')

    expect(pointerOf(requireAt(drawn, 0))).toBeCloseTo(definition.defaults.magnification, 4)
    expect(pointerOf(requireAt(drawn, 1))).toBeLessThan(definition.defaults.magnification)
    expect(pointerOf(requireAt(drawn, 1))).toBeGreaterThan(1)
    expect(pointerOf(requireAt(drawn, 5))).toBe(1)
  })

  it('flattens the row when the cursor is nowhere near it', () => {
    renderWithScheduler()

    pointerAt(centreOf(0), 530)
    expect(pointerOf(requireAt(screen.getAllByTestId('dock-item'), 0))).toBeGreaterThan(1)

    pointerAt(centreOf(0), 20)

    for (const item of screen.getAllByTestId('dock-item')) {
      expect(pointerOf(item)).toBe(1)
    }
  })

  it('costs no renders while the pointer moves across it', () => {
    const props = definition.propsSchema.parse(definition.defaults)
    const commits = vi.fn()

    layOutDock()

    render(
      <MotionSchedulerProvider>
        <Profiler id="dock" onRender={commits}>
          <Dock {...props} />
        </Profiler>
      </MotionSchedulerProvider>,
    )

    const mounted = commits.mock.calls.length

    for (let index = 0; index < items.length; index += 1) {
      pointerAt(centreOf(index), 530)
    }

    expect(pointerOf(requireAt(screen.getAllByTestId('dock-item'), 5))).toBeCloseTo(
      definition.defaults.magnification,
      4,
    )
    expect(commits.mock.calls.length).toBe(mounted)
  })

  it('does nothing at all with no scheduler above it', () => {
    layOutDock()
    renderBlock(definition, Dock)

    pointerAt(centreOf(0), 530)

    for (const item of screen.getAllByTestId('dock-item')) {
      expect(item.style.getPropertyValue(DOCK_POINTER_VARIABLE)).toBe('')
    }
  })

  it('gives focus the same peak the cursor gets', () => {
    renderBlock(definition, Dock, { magnification: 1.8 })

    expect(screen.getByTestId('dock').style.getPropertyValue('--ms-dock-magnification')).toBe('1.8')
  })

  it('moves focus along the row with the arrow keys and wraps', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Dock)

    const drawn = screen.getAllByTestId('dock-item')

    requireAt(drawn, 0).focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(requireAt(drawn, 1))

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(document.activeElement).toBe(requireAt(drawn, items.length - 1))

    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(requireAt(drawn, 0))

    await user.keyboard('{End}')
    expect(document.activeElement).toBe(requireAt(drawn, items.length - 1))
  })

  it('keeps every item individually tabbable', () => {
    renderBlock(definition, Dock)

    for (const item of screen.getAllByTestId('dock-item')) {
      expect(item).not.toHaveAttribute('tabindex')
    }
  })

  it('carries the active state in a mark as well as in aria-current', () => {
    const href = requireAt(items, 2).href

    renderBlock(definition, Dock, { activeHref: href })

    const current = screen
      .getAllByTestId('dock-item')
      .filter((item) => item.getAttribute('href') === href)

    expect(current).toHaveLength(1)
    expect(requireAt(current, 0)).toHaveAttribute('aria-current', 'page')
    expect(requireAt(current, 0).querySelector('.bg-accent')).not.toBeNull()
  })

  it('leaves the swell to the stylesheet rather than to a motion channel', () => {
    expect(Object.keys(definition.defaultMotion)).toEqual(['entrance'])
    expect(definition.capabilities.supportsMotion).not.toContain('hover')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Dock)

    await expectNoViolations(container)
  })
})
