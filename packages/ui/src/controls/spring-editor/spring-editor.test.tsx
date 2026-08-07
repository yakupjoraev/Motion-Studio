import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubDragEnvironment } from '../../test/pointer'

import { settleMs } from './spring-curve'
import { SpringEditor } from './spring-editor'

import type { SpringEditorProps, SpringValue } from './spring-editor.types'

const SNAPPY: SpringValue = { stiffness: 400, damping: 30, mass: 1 }

beforeEach(() => {
  stubDragEnvironment()
})

const Fixture = (props: Partial<SpringEditorProps>): ReactElement => (
  <SpringEditor
    label="Spring"
    value={SNAPPY}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

describe('SpringEditor', () => {
  it('offers the three numbers a spring is made of', () => {
    render(<Fixture />)

    expect(screen.getByRole('slider', { name: 'Spring stiffness' })).toHaveAttribute(
      'aria-valuenow',
      '400',
    )
    expect(screen.getByRole('slider', { name: 'Spring damping' })).toHaveAttribute(
      'aria-valuenow',
      '30',
    )
    expect(screen.getByRole('slider', { name: 'Spring mass' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    )
  })

  it('gives every channel a number field beside its slider', () => {
    render(<Fixture />)

    expect(screen.getByRole('spinbutton', { name: 'Spring damping' })).toHaveValue('30')
  })

  it('edits one channel from the keyboard and keeps the other two', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('spinbutton', { name: 'Spring damping' }))
    await user.keyboard('{ArrowUp}')

    expect(onCommit).toHaveBeenLastCalledWith({ stiffness: 400, damping: 31, mass: 1 })
  })

  it('steps mass in tenths, which is the resolution the catalogue uses', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(screen.getByRole('spinbutton', { name: 'Spring mass' }))
    await user.keyboard('{ArrowUp}')

    expect(onCommit.mock.lastCall?.[0].mass).toBe(1.1)
  })

  it('draws the response as one polyline from the integrator', () => {
    const { container } = render(<Fixture />)
    const points = container.querySelector('polyline')?.getAttribute('points') ?? ''

    expect(points.split(' ').length).toBeGreaterThan(100)
  })

  it('redraws when the spring changes', () => {
    const { container, rerender } = render(<Fixture />)
    const before = container.querySelector('polyline')?.getAttribute('points')

    rerender(<Fixture value={{ ...SNAPPY, damping: 8 }} />)

    expect(container.querySelector('polyline')?.getAttribute('points')).not.toBe(before)
  })

  it('says how long the spring takes to settle', () => {
    render(<Fixture />)

    expect(screen.getByRole('status')).toHaveTextContent(`Settles in ${settleMs(SNAPPY)} ms`)
  })

  it('says so when a spring does not settle inside the window it draws', () => {
    render(<Fixture value={{ stiffness: 20, damping: 1, mass: 5 }} />)

    expect(screen.getByRole('status')).toHaveTextContent('Does not settle within two seconds')
  })

  it('is not operable when disabled', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await user.click(screen.getByRole('spinbutton', { name: 'Spring mass' }))
    await user.keyboard('{ArrowUp}')

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
