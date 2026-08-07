import { fireEvent, render, screen } from '@testing-library/react'
import { type ReactElement, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubPointerCapture } from '../../test/pointer'

import { CurveEditor } from './curve-editor'

import type { CubicBezier, CurveEditorProps } from './curve-editor.types'

const STANDARD: CubicBezier = [0.2, 0, 0, 1]

beforeEach(() => {
  stubPointerCapture()
})

const Fixture = (props: Partial<CurveEditorProps>): ReactElement => (
  <CurveEditor
    label="Easing"
    value={STANDARD}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const Live = (): ReactElement => {
  const [value, setValue] = useState<CubicBezier>(STANDARD)

  return <Fixture value={value} onChange={setValue} onCommit={setValue} />
}

const axis = (name: string): HTMLElement => screen.getByRole('slider', { name })

describe('CurveEditor', () => {
  it('gives each control point an axis a keyboard can reach', () => {
    render(<Fixture />)

    for (const name of [
      'Easing point 1 X',
      'Easing point 1 Y',
      'Easing point 2 X',
      'Easing point 2 Y',
    ]) {
      expect(axis(name)).toBeInTheDocument()
    }
  })

  it('announces each axis with its own number', () => {
    render(<Fixture />)

    expect(axis('Easing point 1 X')).toHaveAttribute('aria-valuetext', 'Easing point 1 X 0.2')
    expect(axis('Easing point 2 Y')).toHaveAttribute('aria-valuetext', 'Easing point 2 Y 1')
  })

  // jsdom does not implement a range input's own arrow-key handling, so the change it would produce is
  // dispatched directly. Choosing a native range for each axis is what makes the keyboard path real.
  it('moves a control point along one axis and leaves the other three alone', () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    fireEvent.change(axis('Easing point 1 X'), { target: { value: '0.21' } })

    expect(onCommit).toHaveBeenLastCalledWith([0.21, 0, 0, 1])
  })

  it('steps by a hundredth, which is the resolution a curve is written at', () => {
    render(<Fixture />)

    expect(axis('Easing point 1 X')).toHaveAttribute('step', '0.01')
  })

  it('holds X inside the unit interval the grammar allows', () => {
    render(<Fixture />)

    expect(axis('Easing point 1 X')).toHaveAttribute('min', '0')
    expect(axis('Easing point 1 X')).toHaveAttribute('max', '1')
  })

  it('lets Y overshoot, because a spring-like curve must be expressible', () => {
    render(<Fixture />)

    expect(axis('Easing point 1 Y')).toHaveAttribute('min', '-1')
    expect(axis('Easing point 1 Y')).toHaveAttribute('max', '2')
  })

  it('shows the CSS the curve prints to', () => {
    render(<Fixture />)

    expect(screen.getByTestId('curve-css')).toHaveTextContent('cubic-bezier(0.2, 0, 0, 1)')
  })

  it('drives the preview dot with the curve under edit rather than a copy of it', () => {
    render(<Fixture />)

    expect(screen.getByTestId('curve-preview')).toHaveStyle({
      animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    })
  })

  it('follows the value it is given', () => {
    render(<Live />)
    fireEvent.change(axis('Easing point 2 Y'), { target: { value: '0.99' } })

    expect(screen.getByTestId('curve-css')).toHaveTextContent('cubic-bezier(0.2, 0, 0, 0.99)')
  })

  it('is not operable when disabled', () => {
    render(<Fixture disabled />)

    expect(axis('Easing point 1 X')).toBeDisabled()
    expect(axis('Easing point 2 Y')).toBeDisabled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
