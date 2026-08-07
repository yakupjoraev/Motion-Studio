import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubPointerCapture } from '../../test/pointer'

import { ColorField } from './color-field'

import type { ColorFieldProps } from './color-field.types'

const TOKENS = [{ token: 'accent', label: 'Accent', value: 'oklch(58% 0.18 285)' }] as const

beforeEach(() => {
  stubPointerCapture()
})

const Fixture = (props: Partial<ColorFieldProps>): ReactElement => (
  <ColorField
    label="Background"
    value={{ kind: 'color', color: 'oklch(58% 0.18 285)' }}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const swatch = (): HTMLElement => screen.getByRole('button', { name: /^Background,/ })

describe('ColorField', () => {
  it('names the swatch with the value, which is what § Inspector asks a colour control to announce', () => {
    render(<Fixture tokens={TOKENS} value={{ kind: 'token', token: 'accent' }} />)

    expect(swatch()).toHaveAccessibleName('Background, Accent, oklch 58% 0.18 285')
  })

  it('shows the resolved colour beside the swatch as well as inside it', () => {
    render(<Fixture />)

    expect(screen.getByText('oklch 58% 0.18 285')).toBeInTheDocument()
  })

  it('opens the picker on click and closes it on Escape', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.click(swatch())

    expect(screen.getByRole('group', { name: 'Background' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('group', { name: 'Background' })).toBeNull()
  })

  it('opens the picker from the keyboard', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.tab()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('group', { name: 'Background' })).toBeInTheDocument()
  })

  it('commits what the picker picked', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture tokens={TOKENS} onCommit={onCommit} />)
    await user.click(swatch())
    await user.click(screen.getByRole('button', { name: 'Accent' }))

    expect(onCommit).toHaveBeenCalledWith({ kind: 'token', token: 'accent' })
  })

  it('says Mixed and shows no colour across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(swatch()).toHaveAccessibleName('Background, Mixed')
    expect(screen.getByText('Mixed')).toBeInTheDocument()
  })

  it('leaves the swatch empty for a token this theme does not have', () => {
    render(<Fixture value={{ kind: 'token', token: 'brand' }} />)

    expect(swatch()).toHaveAccessibleName('Background, brand, not in this theme')
    expect(swatch().querySelector('span')).toBeNull()
  })

  it('takes the row id and description', () => {
    render(<Fixture id="row-control" describedBy="row-override" />)

    expect(swatch()).toHaveAttribute('id', 'row-control')
    expect(swatch()).toHaveAttribute('aria-describedby', 'row-override')
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()

    render(<Fixture disabled />)
    await user.click(swatch())

    expect(screen.queryByRole('group', { name: 'Background' })).toBeNull()
  })

  it('has no axe violations closed', async () => {
    const { container } = render(<Fixture tokens={TOKENS} />)

    await expectNoViolations(container)
  })

  it('has no axe violations open', async () => {
    const user = userEvent.setup()
    const { baseElement } = render(<Fixture tokens={TOKENS} alpha background="oklch(100% 0 0)" />)

    await user.click(swatch())

    await expectNoViolations(baseElement)
  })
})
