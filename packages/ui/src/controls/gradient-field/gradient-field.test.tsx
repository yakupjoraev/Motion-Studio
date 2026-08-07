import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubDragEnvironment } from '../../test/pointer'

import { fromCss, toCss } from './gradient-css'
import { GradientField } from './gradient-field'

import type { Gradient } from '@motion-studio/tokens'
import type { GradientFieldProps } from './gradient-field.types'

const LINEAR: Gradient = {
  kind: 'linear',
  angle: 135,
  stops: [
    { color: 'oklch(58% 0.18 285)', position: 0 },
    { color: 'oklch(72% 0.16 75)', position: 100 },
  ],
}

beforeEach(() => {
  stubDragEnvironment()
})

const Fixture = (props: Partial<GradientFieldProps>): ReactElement => (
  <GradientField
    label="Background"
    value={LINEAR}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const stop = (position: number): HTMLElement =>
  screen.getByRole('slider', { name: `Background stop ${position}` })

describe('GradientField', () => {
  it('draws one handle per stop', () => {
    render(<Fixture />)

    expect(stop(1)).toHaveAttribute('aria-valuenow', '0')
    expect(stop(2)).toHaveAttribute('aria-valuenow', '100')
  })

  it('announces a stop by its position and its colour', () => {
    render(<Fixture />)

    expect(stop(1)).toHaveAttribute('aria-valuetext', '0%, oklch(58% 0.18 285)')
  })

  it('moves a stop from the keyboard', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(stop(1))
    await user.keyboard('{ArrowRight}')

    expect(onCommit).toHaveBeenLastCalledWith({
      ...LINEAR,
      stops: [
        { color: 'oklch(58% 0.18 285)', position: 1 },
        { color: 'oklch(72% 0.16 75)', position: 100 },
      ],
    })
  })

  it('moves a stop by ten with Shift held', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(stop(1))
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')

    expect(onCommit.mock.lastCall?.[0].stops[0].position).toBe(10)
  })

  it('adds a stop half way to the next one', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Add a stop after stop 1' }))

    expect(onCommit.mock.lastCall?.[0].stops).toHaveLength(3)
    expect(onCommit.mock.lastCall?.[0].stops[1].position).toBe(50)
  })

  it('deletes a stop', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    const three: Gradient = {
      ...LINEAR,
      stops: [...LINEAR.stops, { color: 'oklch(100% 0 0)', position: 50 }].sort(
        (a, b) => a.position - b.position,
      ),
    }

    render(<Fixture value={three} onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Delete stop 1' }))

    expect(onCommit.mock.lastCall?.[0].stops).toHaveLength(2)
  })

  it('will not delete below two stops', () => {
    render(<Fixture />)

    expect(screen.getByRole('button', { name: 'Delete stop 1' })).toBeDisabled()
  })

  it('round-trips the value it edits to a CSS string', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(stop(2))
    await user.keyboard('{ArrowLeft}')

    const next = onCommit.mock.lastCall?.[0] as Gradient

    expect(fromCss(toCss(next))).toEqual(next)
  })

  it('switches kind and carries the stops across', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('radio', { name: 'Radial' }))

    expect(onCommit).toHaveBeenLastCalledWith({
      kind: 'radial',
      shape: 'ellipse',
      at: { x: 50, y: 50 },
      stops: LINEAR.stops,
    })
  })

  it('offers only the kinds the caller allows', () => {
    render(<Fixture kinds={['linear', 'radial']} />)

    expect(screen.queryByRole('radio', { name: 'Conic' })).toBeNull()
  })

  it('turns the angle dial from the keyboard', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('slider', { name: 'Background angle' }))
    await user.keyboard('{ArrowRight}')

    expect(onCommit).toHaveBeenLastCalledWith({ ...LINEAR, angle: 136 })
  })

  it('wraps the angle rather than running past a full turn', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture value={{ ...LINEAR, angle: 359 }} onCommit={onCommit} />)
    await user.click(screen.getByRole('slider', { name: 'Background angle' }))
    await user.keyboard('{ArrowRight}')

    expect(onCommit.mock.lastCall?.[0].angle).toBe(0)
  })

  it('announces the angle in degrees', () => {
    render(<Fixture />)

    expect(screen.getByRole('slider', { name: 'Background angle' })).toHaveAttribute(
      'aria-valuetext',
      '135 degrees',
    )
  })

  it('offers a centre for a radial gradient and no angle dial', () => {
    render(
      <Fixture
        value={{ kind: 'radial', shape: 'circle', at: { x: 30, y: 70 }, stops: LINEAR.stops }}
      />,
    )

    expect(screen.getByRole('spinbutton', { name: 'Background centre X' })).toHaveValue('30%')
    expect(screen.queryByRole('slider', { name: 'Background angle' })).toBeNull()
  })

  it('shows a mesh gradient as a preview and says it is edited as a preset', () => {
    render(
      <Fixture
        value={{
          kind: 'mesh',
          blur: 80,
          points: [{ color: 'oklch(58% 0.18 285)', x: 20, y: 25, radius: 55 }],
        }}
      />,
    )

    expect(screen.getByText(/chosen as a preset/)).toBeInTheDocument()
    expect(screen.queryByRole('slider', { name: 'Background stop 1' })).toBeNull()
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Add a stop after stop 1' }))

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
