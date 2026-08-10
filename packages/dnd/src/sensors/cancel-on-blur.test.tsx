import { fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CANCEL_KEY, useCancelDragOnBlur } from './cancel-on-blur'

function Host({ dragging }: { readonly dragging: boolean }) {
  useCancelDragOnBlur(dragging)

  return null
}

const keys = (): string[] => {
  const seen: string[] = []
  const listener = (event: Event): void => {
    seen.push(event instanceof KeyboardEvent ? event.code : event.type)
  }

  document.addEventListener('keydown', listener)
  cleanups.push(() => document.removeEventListener('keydown', listener))

  return seen
}

const cleanups: (() => void)[] = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup()
  }
})

describe('useCancelDragOnBlur', () => {
  it('delivers the cancel key when the window loses focus mid-drag', () => {
    const seen = keys()

    render(<Host dragging />)
    fireEvent.blur(window)

    expect(seen).toEqual([CANCEL_KEY])
  })

  it('does nothing when no drag is in flight', () => {
    const seen = keys()

    render(<Host dragging={false} />)
    fireEvent.blur(window)

    expect(seen).toEqual([])
  })

  it('stops listening when the drag ends', () => {
    const seen = keys()
    const view = render(<Host dragging />)

    view.rerender(<Host dragging={false} />)
    fireEvent.blur(window)

    expect(seen).toEqual([])
  })

  it('adds no listener that outlives the component', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const view = render(<Host dragging />)

    view.unmount()

    expect(remove).toHaveBeenCalledWith('blur', expect.any(Function))
  })
})
