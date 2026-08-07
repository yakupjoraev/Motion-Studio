import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { stubPointerCapture } from '../../test/pointer'

import { ColorPicker } from './color-picker'
import { contrastReadout } from './color-value'

import type { ColorPickerProps, ColorTokenPreset } from './color-picker.types'

const TOKENS: readonly ColorTokenPreset[] = [
  { token: 'accent', label: 'Accent', value: 'oklch(58% 0.18 285)' },
  { token: 'danger', label: 'Danger', value: 'oklch(58% 0.2 25)' },
]

beforeEach(() => {
  stubPointerCapture()
})

const Fixture = (props: Partial<ColorPickerProps>): ReactElement => (
  <ColorPicker
    label="Background"
    value={{ kind: 'color', color: 'oklch(58% 0.18 285)' }}
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const hexField = (): HTMLInputElement =>
  screen.getByRole('textbox', { name: 'Background hex' }) as HTMLInputElement

const picker = (): HTMLElement => screen.getByRole('group', { name: 'Background' })

describe('ColorPicker', () => {
  it('offers a keyboard-operable area and hue slider', () => {
    render(<Fixture />)

    // The area exposes one slider carrying both channels, plus the hue slider beside it.
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    expect(screen.getByRole('slider', { name: /saturation and brightness/ })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Background hue' })).toBeInTheDocument()
  })

  it('adds an opacity slider only when the caller allows alpha', () => {
    const { rerender } = render(<Fixture />)

    expect(screen.queryByRole('slider', { name: 'Background opacity' })).toBeNull()

    rerender(<Fixture alpha />)

    expect(screen.getByRole('slider', { name: 'Background opacity' })).toBeInTheDocument()
  })

  it('stores the token reference, not the resolved colour, so the colour follows the theme', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture tokens={TOKENS} onCommit={onCommit} />)
    await user.click(screen.getByRole('button', { name: 'Accent' }))

    expect(onCommit).toHaveBeenCalledWith({ kind: 'token', token: 'accent' })
  })

  it('marks the token the value refers to', () => {
    render(<Fixture tokens={TOKENS} value={{ kind: 'token', token: 'danger' }} />)

    expect(screen.getByRole('button', { name: 'Danger' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Accent' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('announces the value as a name where there is one', () => {
    render(<Fixture tokens={TOKENS} value={{ kind: 'token', token: 'accent' }} />)

    expect(picker()).toHaveAccessibleDescription(/Accent, oklch 58% 0.18 285/)
  })

  it('reads the contrast against the background it was given', () => {
    render(
      <Fixture
        value={{ kind: 'color', color: 'oklch(0% 0 0)' }}
        background="oklch(100% 0 0)"
        tokens={TOKENS}
      />,
    )

    const expected = contrastReadout('#000000', 'oklch(100% 0 0)')

    expect(screen.getByRole('status')).toHaveTextContent(expected.text)
  })

  it('announces a failing contrast as failing, not only as a colour', () => {
    render(
      <Fixture value={{ kind: 'color', color: 'oklch(100% 0 0)' }} background="oklch(100% 0 0)" />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('fails AA')
  })

  it('leaves the contrast readout out when there is no background to measure against', () => {
    render(<Fixture />)

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('takes a hex typed into the field', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.clear(hexField())
    await user.type(hexField(), '#ff0000{Enter}')

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit.mock.calls[0]?.[0]).toMatchObject({ kind: 'color' })
  })

  it('marks an unparseable draft invalid while it is being typed', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.clear(hexField())
    await user.type(hexField(), 'scarlet')

    expect(hexField()).toHaveAttribute('aria-invalid', 'true')
  })

  it('reverts an unparseable draft rather than committing it', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    const before = hexField().value

    await user.clear(hexField())
    await user.type(hexField(), 'scarlet{Enter}')

    expect(onCommit).not.toHaveBeenCalled()
    expect(hexField().value).toBe(before)
  })

  it('shows an eight-digit hex only when alpha is editable', () => {
    const { rerender } = render(<Fixture />)

    expect(hexField().value).toMatch(/^#[0-9a-f]{6}$/i)

    rerender(<Fixture alpha />)

    expect(hexField().value).toMatch(/^#[0-9a-f]{8}$/i)
  })

  it('hides the eyedropper where the platform has none, rather than offering a dead button', () => {
    render(<Fixture />)

    expect(screen.queryByRole('button', { name: 'Pick a colour from the screen' })).toBeNull()
  })

  it('offers the eyedropper where the platform has one', () => {
    vi.stubGlobal(
      'EyeDropper',
      class {
        open(): Promise<{ sRGBHex: string }> {
          return Promise.resolve({ sRGBHex: '#00ff00' })
        }
      },
    )

    render(<Fixture />)

    expect(
      screen.getByRole('button', { name: 'Pick a colour from the screen' }),
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it('caps the recent row at twelve', () => {
    const recent = Array.from({ length: 20 }, (_, index) => `oklch(50% 0.1 ${index * 10})`)

    render(<Fixture recent={recent} />)

    expect(screen.getAllByRole('button', { name: /^oklch/ })).toHaveLength(12)
  })

  it('says Mixed across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(picker()).toHaveAccessibleDescription(/Mixed/)
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <Fixture alpha tokens={TOKENS} background="oklch(100% 0 0)" recent={['oklch(50% 0 0)']} />,
    )

    await expectNoViolations(container)
  })
})
