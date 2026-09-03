import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { lastOf, resetErrorContext } from './error-context'
import { watchGestures } from './watch-gestures'

let stop: () => void

const press = (init: KeyboardEventInit): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', init))
}

/** `Event`, not `PointerEvent`: jsdom has no constructor for the latter, and only the target matters. */
const clickOn = (element: Element): void => {
  element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
}

describe('the gesture listener', () => {
  beforeEach(() => {
    resetErrorContext()
    document.body.innerHTML = ''
    stop = watchGestures()
  })

  afterEach(() => {
    stop()
  })

  it('names a clicked control by its test id', () => {
    document.body.innerHTML = '<button data-testid="export-open" type="button">Export</button>'

    clickOn(document.querySelector('button') as Element)

    expect(lastOf('gesture')?.label).toBe('click export-open')
  })

  it('names the control a click landed inside of, not the icon it hit', () => {
    document.body.innerHTML =
      '<button data-testid="top-bar-undo" type="button"><svg data-icon="undo"></svg></button>'

    clickOn(document.querySelector('svg') as Element)

    expect(lastOf('gesture')?.label).toBe('click top-bar-undo')
  })

  it('falls back to the role, then to the tag, when nothing is identified', () => {
    document.body.innerHTML = '<div role="switch">Grid</div><span>plain</span>'

    clickOn(document.querySelector('[role="switch"]') as Element)
    expect(lastOf('gesture')?.label).toBe('click switch')

    clickOn(document.querySelector('span') as Element)
    expect(lastOf('gesture')?.label).toBe('click span')
  })

  it('writes a shortcut with its modifiers', () => {
    press({ key: 'z', ctrlKey: true })
    expect(lastOf('gesture')?.label).toBe('press Mod+z')

    press({ key: 'z', metaKey: true, shiftKey: true })
    expect(lastOf('gesture')?.label).toBe('press Mod+Shift+z')

    press({ key: 'Escape' })
    expect(lastOf('gesture')?.label).toBe('press Escape')
  })

  /**
   * The leak this listener is most likely to become: a keystroke log of a user typing their own
   * copy into a heading. A printable key with no modifier says only that typing happened.
   */
  it('records typing without the characters typed', () => {
    press({ key: 'a' })
    expect(lastOf('gesture')?.label).toBe('type')

    press({ key: 'Q', shiftKey: true })
    expect(lastOf('gesture')?.label).toBe('type')
  })

  it('ignores a modifier held on its own, so it cannot push the real key out of the buffer', () => {
    press({ key: 'Shift', shiftKey: true })

    expect(lastOf('gesture')).toBeNull()
  })

  /** A crash inside a click handler must still say which click — hence the capture phase. */
  it('records the click before the handler that could throw runs', () => {
    document.body.innerHTML = '<button data-testid="broken" type="button">Break</button>'
    const button = document.querySelector('button') as Element
    const seenByHandler: (string | undefined)[] = []

    button.addEventListener('pointerdown', () => {
      seenByHandler.push(lastOf('gesture')?.label)
    })

    clickOn(button)

    expect(seenByHandler).toEqual(['click broken'])
  })

  it('stops recording once torn down', () => {
    stop()
    press({ key: 'Escape' })

    expect(lastOf('gesture')).toBeNull()
  })
})
