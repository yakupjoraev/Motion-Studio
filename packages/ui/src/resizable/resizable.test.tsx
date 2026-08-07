import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Resizable } from './resizable'

import type { ResizableProps } from './resizable.types'

/**
 * jsdom has no `PointerEvent` at all, and Testing Library falls back to a plain `Event` when it is missing —
 * which carries no `clientX`, so every drag below would compute a delta from `undefined`. Extending
 * `MouseEvent` is enough: it already has the coordinates, and the drag path only reads `pointerId` beyond
 * them. Measured — without this the component reports `NaN`.
 */
class PointerEventStub extends MouseEvent {
  readonly pointerId: number

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
  }
}

beforeEach(() => {
  vi.stubGlobal('PointerEvent', PointerEventStub)
  // jsdom implements neither, and the drag path calls both on the handle.
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
})

const Fixture = (props: Partial<ResizableProps>): ReactElement => (
  <Resizable
    aria-label="Resize inspector"
    width={320}
    min={280}
    max={420}
    onWidthChange={() => undefined}
    {...props}
  >
    <div>panel</div>
  </Resizable>
)

const handle = (): HTMLElement => screen.getByRole('separator', { name: 'Resize inspector' })

const frameOf = (container: HTMLElement): HTMLElement => container.firstElementChild as HTMLElement

/** A drag, as three pointer events on the handle. `fireEvent` because jsdom has no real pointer. */
const drag = (to: number): void => {
  fireEvent.pointerDown(handle(), { pointerId: 1, clientX: 0 })
  fireEvent.pointerMove(handle(), { pointerId: 1, clientX: to })
  fireEvent.pointerUp(handle(), { pointerId: 1, clientX: to })
}

describe('Resizable', () => {
  it('renders its children and a named separator', () => {
    render(<Fixture />)

    expect(screen.getByText('panel')).toBeInTheDocument()
    expect(handle()).toBeInTheDocument()
  })

  it('reports the width through the separator’s value, which is what announces it', () => {
    render(<Fixture />)

    expect(handle()).toHaveAttribute('aria-valuenow', '320')
    expect(handle()).toHaveAttribute('aria-valuemin', '280')
    expect(handle()).toHaveAttribute('aria-valuemax', '420')
    expect(handle()).toHaveAttribute('aria-valuetext', '320 pixels')
  })

  it('drives the width through a custom property rather than a style prop', () => {
    // Contract § 5: the drag writes here, so the panel follows the pointer without a React render.
    const { container } = render(<Fixture />)

    expect(frameOf(container).style.getPropertyValue('--ms-resizable-width')).toBe('320px')
  })

  it('is one tab stop and takes the focus ring', async () => {
    render(<Fixture />)

    await userEvent.tab()

    expect(handle()).toHaveFocus()
    expect(handle().className).toContain('focus-visible:shadow-focus')
  })

  it('steps by 8px with the arrow keys', async () => {
    const onWidthChange = vi.fn()
    render(<Fixture onWidthChange={onWidthChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(onWidthChange).toHaveBeenLastCalledWith(328)
  })

  it('steps the other way for a handle on the other edge', async () => {
    const onWidthChange = vi.fn()
    render(<Fixture side="left" onWidthChange={onWidthChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    // The inspector's handle is on its left edge, so dragging or stepping right narrows it.
    expect(onWidthChange).toHaveBeenLastCalledWith(312)
  })

  it('snaps to the bounds with Home and End', async () => {
    const onWidthChange = vi.fn()
    render(<Fixture onWidthChange={onWidthChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{Home}')
    expect(onWidthChange).toHaveBeenLastCalledWith(280)

    await userEvent.keyboard('{End}')
    expect(onWidthChange).toHaveBeenLastCalledWith(420)
  })

  it('ignores a key it does not own', async () => {
    const onWidthChange = vi.fn()
    render(<Fixture onWidthChange={onWidthChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(onWidthChange).not.toHaveBeenCalled()
  })

  it('stops at the bounds rather than running past them', async () => {
    const onWidthChange = vi.fn()
    render(<Fixture width={416} onWidthChange={onWidthChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')

    expect(onWidthChange).toHaveBeenLastCalledWith(420)
  })

  it('follows the pointer during a drag without telling React', () => {
    const onWidthChange = vi.fn()
    const { container } = render(<Fixture onWidthChange={onWidthChange} />)

    fireEvent.pointerDown(handle(), { pointerId: 1, clientX: 0 })
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 40 })

    expect(frameOf(container).style.getPropertyValue('--ms-resizable-width')).toBe('360px')
    // Mid-drag is not a commit: the caller hears nothing until the pointer is released.
    expect(onWidthChange).not.toHaveBeenCalled()
  })

  it('keeps the announced value in step with the drag', () => {
    render(<Fixture />)

    fireEvent.pointerDown(handle(), { pointerId: 1, clientX: 0 })
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 40 })

    expect(handle()).toHaveAttribute('aria-valuenow', '360')
  })

  it('commits once, when the pointer is released', () => {
    const onWidthChange = vi.fn()
    render(<Fixture onWidthChange={onWidthChange} />)

    drag(40)

    expect(onWidthChange).toHaveBeenCalledTimes(1)
    expect(onWidthChange).toHaveBeenCalledWith(360)
  })

  it('clamps a drag to the bounds', () => {
    const onWidthChange = vi.fn()
    render(<Fixture onWidthChange={onWidthChange} />)

    drag(500)

    expect(onWidthChange).toHaveBeenCalledWith(420)
  })

  it('ignores a pointer move that no press started', () => {
    const onWidthChange = vi.fn()
    const { container } = render(<Fixture onWidthChange={onWidthChange} />)

    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 400 })
    fireEvent.pointerUp(handle(), { pointerId: 1, clientX: 400 })

    expect(frameOf(container).style.getPropertyValue('--ms-resizable-width')).toBe('320px')
    expect(onWidthChange).not.toHaveBeenCalled()
  })

  it('takes a committed width from the caller over whatever the drag painted', () => {
    const { container, rerender } = render(<Fixture width={320} />)

    fireEvent.pointerDown(handle(), { pointerId: 1, clientX: 0 })
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 40 })
    fireEvent.pointerUp(handle(), { pointerId: 1, clientX: 40 })

    rerender(<Fixture width={300} />)

    expect(frameOf(container).style.getPropertyValue('--ms-resizable-width')).toBe('300px')
  })

  it('shows the 4px line inside an 8px target', () => {
    // § Layout: "the handle is 4 px wide with an 8 px hit area".
    render(<Fixture />)

    expect(handle().className).toContain('w-[8px]')
    expect(handle().firstElementChild?.className).toContain('w-[4px]')
  })

  it('uses the resize cursor § Cursors assigns it', () => {
    render(<Fixture />)

    expect(handle().className).toContain('cursor-col-resize')
  })

  it('forwards an object ref to the frame', () => {
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(
      <Resizable
        ref={ref}
        aria-label="Resize inspector"
        width={320}
        min={280}
        max={420}
        onWidthChange={() => undefined}
      >
        <div>panel</div>
      </Resizable>,
    )

    expect(ref.current).toBe(frameOf(container))
  })

  it('forwards a callback ref to the frame', () => {
    const seen = vi.fn()
    const { container } = render(
      <Resizable
        ref={seen}
        aria-label="Resize inspector"
        width={320}
        min={280}
        max={420}
        onWidthChange={() => undefined}
      >
        <div>panel</div>
      </Resizable>,
    )

    expect(seen).toHaveBeenCalledWith(frameOf(container))
  })

  it('is axe clean', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
