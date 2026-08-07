import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubDragEnvironment } from '../../test/pointer'

import { SliderField } from './slider-field'

import type { SliderFieldProps } from './slider-field.types'

beforeEach(() => {
  stubDragEnvironment()
})

const Fixture = (props: Partial<SliderFieldProps>): ReactElement => (
  <SliderField
    label="Opacity"
    value={50}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const track = (): HTMLElement => screen.getByRole('slider', { name: 'Opacity' })
const number = (): HTMLElement => screen.getByRole('spinbutton', { name: 'Opacity' })

describe('SliderField', () => {
  it('draws one value as two halves of one control', () => {
    render(<Fixture />)

    expect(track()).toHaveAttribute('aria-valuenow', '50')
    expect(number()).toHaveValue('50')
  })

  it('changes per step and commits on release from the slider half', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(<Fixture onChange={onChange} onCommit={onCommit} />)
    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onChange).toHaveBeenLastCalledWith(51)
    expect(onCommit).toHaveBeenLastCalledWith(51)
  })

  it('edits from the number half', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(number())
    await user.keyboard('{ArrowUp}')

    expect(onCommit).toHaveBeenLastCalledWith(51)
  })

  it('accepts an expression in the number half', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(number())
    await user.clear(number())
    await user.type(number(), '20*3{Enter}')

    expect(onCommit).toHaveBeenCalledWith(60)
  })

  it('announces the unit on both halves', () => {
    render(<Fixture value={16} min={0} max={64} unit="px" />)

    expect(track()).toHaveAttribute('aria-valuetext', '16 pixels')
    expect(number()).toHaveAttribute('aria-valuetext', '16 pixels')
  })

  it('gives the number half the row id, because that is what focusing the control means', () => {
    render(<Fixture id="row-control" />)

    expect(number()).toHaveAttribute('id', 'row-control')
    expect(track()).not.toHaveAttribute('id', 'row-control')
  })

  it('shares the bounds between the halves', () => {
    render(<Fixture value={16} min={4} max={64} />)

    expect(track()).toHaveAttribute('aria-valuemin', '4')
    expect(track()).toHaveAttribute('aria-valuemax', '64')
    expect(number()).toHaveAttribute('aria-valuemin', '4')
    expect(number()).toHaveAttribute('aria-valuemax', '64')
  })

  it('says Mixed on both halves across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(track()).toHaveAttribute('aria-valuetext', 'Mixed')
    expect(number()).toHaveAttribute('aria-valuetext', 'Mixed')
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture unit="%" />)

    await expectNoViolations(container)
  })
})
