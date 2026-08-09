import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderCanvas } from '../test/harness'
import { stubGestureEnvironment } from '../test/pointer'
import { fakeScene } from '../test/scene'
import { VIEWPORT_VARS } from '../viewport/use-viewport'

import { ANNOUNCE_DEBOUNCE_MS } from './selection-announcer'
import { NUDGE_STEP, NUDGE_STEP_COARSE, arrowStep } from './use-keyboard-selection'

const build = () =>
  fakeScene({
    root: { children: ['hero', 'gallery', 'footer'], name: 'Page' },
    hero: { children: ['heading', 'body'], name: 'Hero' },
    heading: { name: 'Heading' },
    body: { name: 'Body' },
    gallery: { children: [], name: 'Gallery' },
    footer: { children: [], name: 'Footer' },
  })

const key = (init: KeyboardEventInit & { key: string }) =>
  fireEvent.keyDown(screen.getByTestId('canvas-root'), init)

beforeEach(() => {
  vi.useFakeTimers()
  stubGestureEnvironment()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('arrowStep', () => {
  it('is SHORTCUTS.md § Transform and nothing invented beside it', () => {
    const event = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init)

    expect(arrowStep(event({}), 8)).toBe(NUDGE_STEP)
    expect(arrowStep(event({ shiftKey: true }), 8)).toBe(NUDGE_STEP_COARSE)
    expect(arrowStep(event({ altKey: true }), 16)).toBe(16)
  })
})

describe('useKeyboardSelection', () => {
  it('walks siblings with Tab and wraps at the end', () => {
    const fake = build()

    renderCanvas(fake)
    key({ key: 'Tab' })

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero')])

    key({ key: 'Tab' })
    key({ key: 'Tab' })

    expect(fake.scene.selectedIds()).toEqual([fake.id('footer')])

    key({ key: 'Tab' })

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero')])
  })

  it('walks back with Shift+Tab', () => {
    const fake = build()

    renderCanvas(fake)
    fake.selection.select([fake.id('gallery')], 'replace')
    key({ key: 'Tab', shiftKey: true })

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero')])
  })

  it('enters on Enter and takes the first child', () => {
    const fake = build()

    renderCanvas(fake)
    fake.selection.select([fake.id('hero')], 'replace')
    key({ key: 'Enter' })

    expect(fake.scene.isolationId()).toBe(fake.id('hero'))
    expect(fake.scene.selectedIds()).toEqual([fake.id('heading')])
  })

  it('does not enter a leaf', () => {
    const fake = build()

    renderCanvas(fake)
    fake.selection.select([fake.id('gallery')], 'replace')
    key({ key: 'Enter' })

    expect(fake.scene.isolationId()).toBeNull()
  })

  it('leaves the container on the first Esc and clears on the second', () => {
    const fake = build()

    renderCanvas(fake)
    fake.selection.enter(fake.id('hero'))
    fake.selection.select([fake.id('heading')], 'replace')
    key({ key: 'Escape' })

    expect(fake.scene.isolationId()).toBeNull()
    expect(fake.scene.selectedIds()).toEqual([fake.id('heading')])

    key({ key: 'Escape' })

    expect(fake.scene.selectedIds()).toEqual([])
  })

  it('takes the level with Mod+A and drops it with Mod+Shift+A', () => {
    const fake = build()

    renderCanvas(fake)
    key({ key: 'a', ctrlKey: true })

    expect(fake.scene.selectedIds()).toEqual([
      fake.id('hero'),
      fake.id('gallery'),
      fake.id('footer'),
    ])

    key({ key: 'A', ctrlKey: true, shiftKey: true })

    expect(fake.scene.selectedIds()).toEqual([])
    expect(fake.scene.isolationId()).toBeNull()
  })

  it('takes the level inside a container after entering it', () => {
    const fake = build()

    renderCanvas(fake)
    fake.selection.enter(fake.id('hero'))
    key({ key: 'a', metaKey: true })

    expect(fake.scene.selectedIds()).toEqual([fake.id('heading'), fake.id('body')])
  })

  it('walks to the parent and back down with Mod+Shift+arrows', () => {
    const fake = build()

    renderCanvas(fake)
    fake.selection.select([fake.id('heading')], 'replace')
    key({ key: 'ArrowUp', ctrlKey: true, shiftKey: true })

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero')])

    key({ key: 'ArrowDown', ctrlKey: true, shiftKey: true })

    expect(fake.scene.selectedIds()).toEqual([fake.id('heading')])
  })

  it('does not walk up past the root, which is a level and not a node', () => {
    const fake = build()

    renderCanvas(fake)
    fake.selection.select([fake.id('hero')], 'replace')
    key({ key: 'ArrowUp', ctrlKey: true, shiftKey: true })

    expect(fake.scene.selectedIds()).toEqual([fake.id('hero')])
  })

  it('nudges by the step the modifiers ask for', () => {
    const fake = build()

    renderCanvas(fake, { gridSize: 16 })
    key({ key: 'ArrowRight' })
    key({ key: 'ArrowUp', shiftKey: true })
    key({ key: 'ArrowLeft', altKey: true })

    expect(fake.selection.nudge).toHaveBeenNthCalledWith(1, 1, 0)
    expect(fake.selection.nudge).toHaveBeenNthCalledWith(2, 0, -10)
    expect(fake.selection.nudge).toHaveBeenNthCalledWith(3, -16, 0)
  })

  it('pans instead of nudging while space is held', () => {
    const fake = build()

    renderCanvas(fake)

    const root = screen.getByTestId('canvas-root')

    root.dataset['panMode'] = 'true'
    key({ key: 'ArrowRight', shiftKey: true })

    act(() => {
      vi.advanceTimersToNextFrame()
    })

    expect(fake.selection.nudge).not.toHaveBeenCalled()
    expect(screen.getByTestId('canvas-root').style.getPropertyValue(VIEWPORT_VARS.x)).toBe('-10px')
  })

  it('announces every move it makes', () => {
    const fake = build()

    renderCanvas(fake)
    key({ key: 'Tab' })

    act(() => {
      vi.advanceTimersByTime(ANNOUNCE_DEBOUNCE_MS)
    })

    expect(screen.getByRole('status')).toHaveTextContent('Hero selected. 1 of 3 in Page.')
  })

  it('says what was left when a container is exited', () => {
    const fake = build()

    renderCanvas(fake)
    fake.selection.enter(fake.id('hero'))
    key({ key: 'Escape' })

    act(() => {
      vi.advanceTimersByTime(ANNOUNCE_DEBOUNCE_MS)
    })

    expect(screen.getByRole('status')).toHaveTextContent('Exited Hero.')
  })

  it('leaves keys it does not own alone', () => {
    const fake = build()

    renderCanvas(fake)

    const event = new KeyboardEvent('keydown', { key: 'F2', cancelable: true, bubbles: true })

    screen.getByTestId('canvas-root').dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })
})
