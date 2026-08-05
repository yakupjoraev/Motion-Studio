import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { Input } from './input'

describe('Input', () => {
  it('renders an editable field with its default props', () => {
    render(<Input aria-label="Width" />)

    expect(screen.getByRole('textbox', { name: 'Width' })).toBeInTheDocument()
  })

  it('accepts typed text', async () => {
    render(<Input aria-label="Width" />)

    await userEvent.type(screen.getByRole('textbox'), '240')

    expect(screen.getByRole('textbox')).toHaveValue('240')
  })

  it('is reachable by Tab and reports focus', async () => {
    render(<Input aria-label="Width" />)

    await userEvent.tab()

    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('forwards its ref to the field rather than to the wrapper', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={ref} aria-label="Width" />)

    expect(ref.current).toBe(screen.getByRole('textbox'))
  })

  it('renders prefix and suffix slots inside the field', () => {
    render(<Input aria-label="Blur" prefix={<span data-testid="prefix">⌀</span>} suffix="px" />)

    expect(screen.getByTestId('prefix')).toBeInTheDocument()
    expect(screen.getByText('px')).toBeInTheDocument()
  })

  it('omits a slot entirely when it is not given', () => {
    const { container } = render(<Input aria-label="Width" />)

    expect(container.querySelectorAll('span')).toHaveLength(0)
  })

  it('exposes the invalid state to assistive technology, not only as a border colour', () => {
    render(<Input aria-label="Width" invalid />)

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('leaves aria-invalid off when the field is valid', () => {
    render(<Input aria-label="Width" />)

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid')
  })

  it('blocks input and pointer interaction when disabled', async () => {
    const onChange = vi.fn()
    render(<Input aria-label="Width" disabled onChange={onChange} />)

    await userEvent.type(screen.getByRole('textbox'), '10')

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('takes its height from the density scale', () => {
    const { container } = render(<Input aria-label="Width" />)

    // § Density scale puts an input at 26 px, and density.ts is the only place that number is written.
    expect(container.firstElementChild?.className).toContain('h-[26px]')
  })

  it('puts the focus ring on the wrapper, so the slots sit inside it', () => {
    const { container } = render(<Input aria-label="Width" suffix="px" />)
    const wrapper = container.firstElementChild?.className ?? ''

    expect(wrapper).toContain('outline-none')
    expect(wrapper).toContain('shadow-focus')
  })

  it('spreads unknown props onto the field', () => {
    render(<Input aria-label="Width" data-testid="probe" inputMode="numeric" />)

    expect(screen.getByTestId('probe')).toHaveAttribute('inputmode', 'numeric')
  })

  it('is axe clean', async () => {
    const { container } = render(<Input aria-label="Width" />)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('is axe clean with slots and an invalid state', async () => {
    const { container } = render(<Input aria-label="Blur" invalid prefix="⌀" suffix="px" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
