import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { ScrubField } from './scrub-field'

import type { ScrubFieldProps } from './scrub-field.types'

/** jsdom ships no `PointerEvent`; Testing Library then sends a bare `Event` with no coordinates. */
class PointerEventStub extends MouseEvent {
  readonly pointerId: number

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
  }
}

beforeEach(() => {
  vi.stubGlobal('PointerEvent', PointerEventStub)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  // Synchronous frames: the per-frame coalescing is what is under test, not the browser's scheduler.
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)

    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => undefined)
})

const Fixture = (props: Partial<ScrubFieldProps>): ReactElement => (
  <ScrubField
    label="Radius"
    value={16}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const field = (): HTMLElement => screen.getByRole('spinbutton', { name: 'Radius' })

interface DragStep {
  readonly clientX: number
  readonly shiftKey?: boolean
  readonly altKey?: boolean
}

function drag(element: HTMLElement, steps: readonly DragStep[]): void {
  fireEvent.pointerDown(element, { clientX: 0, pointerId: 1 })

  for (const step of steps) {
    fireEvent.pointerMove(element, { pointerId: 1, ...step })
  }

  fireEvent.pointerUp(element, { clientX: steps.at(-1)?.clientX ?? 0, pointerId: 1 })
}

describe('ScrubField', () => {
  it('renders the value with its unit inside the field', () => {
    render(<Fixture unit="px" />)

    expect(field()).toHaveValue('16px')
  })

  it('announces the value with the unit spelled out', () => {
    render(<Fixture unit="px" />)

    expect(field()).toHaveAttribute('aria-valuetext', '16 pixels')
  })

  it.each([
    ['%', '16 percent'],
    ['deg', '16 degrees'],
    ['ms', '16 milliseconds'],
    ['fr', '16 fr'],
  ])('spells %s as %s', (unit, spoken) => {
    render(<Fixture unit={unit} />)

    expect(field()).toHaveAttribute('aria-valuetext', spoken)
  })

  it('exposes the bounds it was given', () => {
    render(<Fixture min={0} max={64} />)

    expect(field()).toHaveAttribute('aria-valuenow', '16')
    expect(field()).toHaveAttribute('aria-valuemin', '0')
    expect(field()).toHaveAttribute('aria-valuemax', '64')
  })

  it('turns a horizontal drag into a value delta', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    drag(field(), [{ clientX: 20 }])

    expect(onCommit).toHaveBeenCalledWith(36)
  })

  it('multiplies the delta by ten while Shift is held', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    drag(field(), [{ clientX: 20, shiftKey: true }])

    expect(onCommit).toHaveBeenCalledWith(216)
  })

  it('divides the delta by ten while Alt is held', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} step={0.1} />)
    drag(field(), [{ clientX: 20, altKey: true }])

    expect(onCommit).toHaveBeenCalledWith(16.2)
  })

  it('applies a modifier pressed part way through a drag', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    // 10 px plain, then 10 px more with Shift: 16 + 10 + 100.
    drag(field(), [{ clientX: 10 }, { clientX: 20, shiftKey: true }])

    expect(onCommit).toHaveBeenCalledWith(126)
  })

  it('fires onChange during the drag and onCommit exactly once, on release', () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture onChange={onChange} onCommit={onCommit} />)
    drag(field(), [{ clientX: 10 }, { clientX: 20 }, { clientX: 30 }, { clientX: 40 }])

    expect(onChange.mock.calls.length).toBeGreaterThan(1)
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it('ignores a press that never travels the activation distance', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    drag(field(), [{ clientX: 3 }])

    expect(onCommit).not.toHaveBeenCalled()
    expect(field()).toHaveFocus()
  })

  it('holds the value inside its bounds while dragging', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} min={0} max={24} />)
    drag(field(), [{ clientX: 100 }])

    expect(onCommit).toHaveBeenCalledWith(24)
  })

  it('steps with the arrow keys', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(field())
    await user.keyboard('{ArrowUp}')

    expect(onCommit).toHaveBeenLastCalledWith(17)

    await user.keyboard('{ArrowDown}{ArrowDown}')

    expect(onCommit).toHaveBeenLastCalledWith(15)
  })

  it('applies the modifiers to an arrow step', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} step={0.1} precision={2} />)
    await user.click(field())
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')

    expect(onCommit).toHaveBeenLastCalledWith(17)

    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')

    expect(onCommit).toHaveBeenLastCalledWith(16.99)
  })

  it('evaluates a typed expression on Enter and keeps focus', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(field())
    await user.clear(field())
    await user.type(field(), '16*2{Enter}')

    expect(onCommit).toHaveBeenCalledWith(32)
    expect(field()).toHaveFocus()
  })

  it('accepts a typed value carrying its own unit', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} unit="px" />)
    await user.click(field())
    await user.clear(field())
    await user.type(field(), '8px+4px{Enter}')

    expect(onCommit).toHaveBeenCalledWith(12)
  })

  it('reverts an unparseable draft rather than clearing the value', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} unit="px" />)
    await user.click(field())
    await user.clear(field())
    await user.type(field(), 'wide{Enter}')

    expect(onCommit).not.toHaveBeenCalled()
    expect(field()).toHaveValue('16px')
  })

  it('reverts to the value at focus time on Escape', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(field())
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}')

    expect(onCommit).toHaveBeenLastCalledWith(19)

    await user.keyboard('{Escape}')

    expect(onCommit).toHaveBeenLastCalledWith(16)
  })

  it('does not commit on Escape when nothing changed', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(field())
    await user.keyboard('{Escape}')

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits a draft on blur', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(
      <>
        <Fixture onCommit={onCommit} />
        <button type="button">elsewhere</button>
      </>,
    )
    await user.click(field())
    await user.clear(field())
    await user.type(field(), '40')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))

    expect(onCommit).toHaveBeenCalledWith(40)
  })

  it('shows Mixed instead of an empty value across a disagreeing selection', () => {
    render(<Fixture mixed unit="px" />)

    expect(field()).toHaveValue('')
    expect(field()).toHaveAttribute('placeholder', 'Mixed')
    expect(field()).toHaveAttribute('aria-valuetext', 'Mixed')
  })

  it('does not drag while disabled', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} disabled />)
    drag(field(), [{ clientX: 40 }])

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('rounds to the precision implied by the step', () => {
    const onCommit = vi.fn()

    render(<Fixture value={0} onCommit={onCommit} step={0.25} />)
    drag(field(), [{ clientX: 5 }])

    expect(onCommit).toHaveBeenCalledWith(1.25)
    expect(field()).toHaveValue('1.25')
  })

  it('takes the row description when hosted by one', () => {
    render(<Fixture describedBy="row-override" labelledBy="row-label" />)

    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-describedby', 'row-override')
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-labelledby', 'row-label')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture unit="px" min={0} max={64} />)

    await expectNoViolations(container)
  })
})
