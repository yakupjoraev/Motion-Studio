import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubDragEnvironment } from '../../test/pointer'

import { SpacingField } from './spacing-field'

import type { SpacingFieldProps } from './spacing-field.types'

beforeEach(() => {
  stubDragEnvironment()
})

const Fixture = (props: Partial<SpacingFieldProps>): ReactElement => (
  <SpacingField
    label="Padding"
    value={{ top: 8, right: 8, bottom: 8, left: 8 }}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const side = (name: string): HTMLElement => screen.getByRole('spinbutton', { name })
const link = (): HTMLElement => screen.getByRole('button', { name: 'Link padding sides' })

const stepUp = async (name: string): Promise<void> => {
  const user = userEvent.setup()

  await user.click(side(name))
  await user.keyboard('{ArrowUp}')
}

describe('SpacingField', () => {
  it('names one field per side', () => {
    render(<Fixture />)

    for (const name of ['Padding top', 'Padding right', 'Padding bottom', 'Padding left']) {
      expect(side(name)).toBeInTheDocument()
    }
  })

  it('drives all four sides from one while linked', async () => {
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await stepUp('Padding top')

    expect(onCommit).toHaveBeenCalledWith({ top: 9, right: 9, bottom: 9, left: 9 })
  })

  it('starts linked, which § Control rows makes the default', () => {
    render(<Fixture />)

    expect(link()).toHaveAttribute('aria-pressed', 'true')
  })

  it('edits one side alone once unlinked', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(link())
    await stepUp('Padding right')

    expect(link()).toHaveAttribute('aria-pressed', 'false')
    expect(onCommit).toHaveBeenCalledWith({ top: 8, right: 9, bottom: 8, left: 8 })
  })

  it('honours the link state the caller opened with', async () => {
    const onCommit = vi.fn()

    render(<Fixture linked={false} onCommit={onCommit} />)
    await stepUp('Padding left')

    expect(onCommit).toHaveBeenCalledWith({ top: 8, right: 8, bottom: 8, left: 9 })
  })

  it('reports the whole value through onChange as well as onCommit', async () => {
    const onChange = vi.fn()

    render(<Fixture onChange={onChange} />)
    await stepUp('Padding top')

    expect(onChange).toHaveBeenLastCalledWith({ top: 9, right: 9, bottom: 9, left: 9 })
  })

  it('holds the sides at the bounds it was given', async () => {
    const onCommit = vi.fn()

    render(<Fixture value={{ top: 8, right: 8, bottom: 8, left: 8 }} max={8} onCommit={onCommit} />)
    await stepUp('Padding top')

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('gives the first side the row id, so a label click lands somewhere', () => {
    render(<Fixture id="row-control" />)

    expect(side('Padding top')).toHaveAttribute('id', 'row-control')
  })

  it('defaults to pixels and shows the unit inside each field', () => {
    render(<Fixture />)

    expect(side('Padding top')).toHaveValue('8px')
  })

  it('says Mixed on every side across a disagreeing selection', () => {
    render(<Fixture mixed />)

    for (const name of ['Padding top', 'Padding right', 'Padding bottom', 'Padding left']) {
      expect(side(name)).toHaveAttribute('aria-valuetext', 'Mixed')
    }
  })

  it('is not operable when disabled', async () => {
    const onCommit = vi.fn()

    render(<Fixture disabled onCommit={onCommit} />)
    await stepUp('Padding top')

    expect(onCommit).not.toHaveBeenCalled()
    expect(link()).toBeDisabled()
  })

  it('has no axe violations', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })
})
