import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Input } from '../input/index'
import { expectNoViolations } from '../test/axe'

import { Label } from './label'

describe('Label', () => {
  it('renders its text', () => {
    render(<Label>Opacity</Label>)

    expect(screen.getByText('Opacity')).toBeInTheDocument()
  })

  it('names the control it points at', () => {
    render(
      <>
        <Label htmlFor="opacity">Opacity</Label>
        <Input id="opacity" />
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'Opacity' })).toBeInTheDocument()
  })

  it('focuses the control when clicked', async () => {
    // § Control rows: "clicking the label focuses the control".
    render(
      <>
        <Label htmlFor="opacity">Opacity</Label>
        <Input id="opacity" />
      </>,
    )

    await userEvent.click(screen.getByText('Opacity'))

    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('announces required rather than only drawing an asterisk', () => {
    render(<Label required>Opacity</Label>)

    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('(required)', { exact: false })).toBeInTheDocument()
  })

  it('draws no asterisk when the control is optional', () => {
    render(<Label>Opacity</Label>)

    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('takes the 88px control-row column', () => {
    render(<Label>Opacity</Label>)

    expect(screen.getByText('Opacity').className).toContain('w-[88px]')
  })

  it('spreads unknown props and forwards its ref', () => {
    const ref = { current: null as HTMLLabelElement | null }
    render(
      <Label ref={ref} data-testid="label">
        Opacity
      </Label>,
    )

    expect(ref.current).toBe(screen.getByTestId('label'))
  })

  it('is axe clean', async () => {
    const { container } = render(
      <>
        <Label htmlFor="opacity">Opacity</Label>
        <Input id="opacity" />
      </>,
    )

    await expectNoViolations(container)
  })
})
