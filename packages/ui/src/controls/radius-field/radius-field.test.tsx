import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubDragEnvironment } from '../../test/pointer'

import { RadiusField } from './radius-field'

import type { RadiusFieldProps } from './radius-field.types'

beforeEach(() => {
  stubDragEnvironment()
})

const Fixture = (props: Partial<RadiusFieldProps>): ReactElement => (
  <RadiusField
    label="Radius"
    value={{ topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 }}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const corner = (name: string): HTMLElement => screen.getByRole('spinbutton', { name })
const link = (): HTMLElement => screen.getByRole('button', { name: 'Link radius corners' })

const stepUp = async (name: string): Promise<void> => {
  const user = userEvent.setup()

  await user.click(corner(name))
  await user.keyboard('{ArrowUp}')
}

describe('RadiusField', () => {
  it('names one field per corner', () => {
    render(<Fixture />)

    for (const name of [
      'Radius top left',
      'Radius top right',
      'Radius bottom right',
      'Radius bottom left',
    ]) {
      expect(corner(name)).toBeInTheDocument()
    }
  })

  it('drives all four corners from one while linked', async () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await stepUp('Radius top left')

    expect(onCommit).toHaveBeenCalledWith({
      topLeft: 5,
      topRight: 5,
      bottomRight: 5,
      bottomLeft: 5,
    })
  })

  it('edits one corner alone once unlinked', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(link())
    await stepUp('Radius bottom right')

    expect(onCommit).toHaveBeenCalledWith({
      topLeft: 4,
      topRight: 4,
      bottomRight: 5,
      bottomLeft: 4,
    })
  })

  it('refuses a negative radius, which has no rendering', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(
      <Fixture
        value={{ topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }}
        onCommit={onCommit}
      />,
    )
    await user.click(corner('Radius top left'))
    await user.keyboard('{ArrowDown}')

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('gives the first corner the row id', () => {
    render(<Fixture id="row-control" />)

    expect(corner('Radius top left')).toHaveAttribute('id', 'row-control')
  })

  it('says Mixed on every corner across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(corner('Radius top left')).toHaveAttribute('aria-valuetext', 'Mixed')
    expect(corner('Radius bottom left')).toHaveAttribute('aria-valuetext', 'Mixed')
  })

  it('is not operable when disabled', async () => {
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await stepUp('Radius top left')

    expect(onCommit).not.toHaveBeenCalled()
    expect(link()).toBeDisabled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
