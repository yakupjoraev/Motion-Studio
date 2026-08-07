import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Select } from './select'

import type { SelectOption } from './select.types'

const OPTIONS: readonly SelectOption[] = [
  { value: 'flex', label: 'flex' },
  { value: 'grid', label: 'grid' },
  { value: 'block', label: 'block' },
  { value: 'none', label: 'none', disabled: true },
]

// Radix Select reaches for pointer capture and measurement that jsdom does not implement.
beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

const open = async (): Promise<void> => {
  await userEvent.tab()
  await userEvent.keyboard('{Enter}')
}

describe('Select', () => {
  it('renders a closed combobox showing its placeholder', () => {
    render(<Select aria-label="Display" options={OPTIONS} placeholder="auto" />)

    const trigger = screen.getByRole('combobox', { name: 'Display' })

    expect(trigger).toHaveTextContent('auto')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the selected label rather than the placeholder', () => {
    render(<Select aria-label="Display" options={OPTIONS} defaultValue="grid" />)

    expect(screen.getByRole('combobox')).toHaveTextContent('grid')
  })

  it('opens on Enter and lists its options', async () => {
    render(<Select aria-label="Display" options={OPTIONS} />)

    await open()

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('selects with the keyboard and reports the new value', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="Display" options={OPTIONS} onValueChange={onValueChange} />)

    await open()
    // Opening already highlights the first option, so one ArrowDown reaches the second.
    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0]?.[0]).toBe('grid')
  })

  it('selects the highlighted option when Enter is pressed straight away', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="Display" options={OPTIONS} onValueChange={onValueChange} />)

    await open()
    await userEvent.keyboard('{Enter}')

    expect(onValueChange.mock.calls[0]?.[0]).toBe('flex')
  })

  it('closes on Escape without changing the value', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="Display" options={OPTIONS} onValueChange={onValueChange} />)

    await open()
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('marks a disabled option as disabled rather than hiding it', async () => {
    render(<Select aria-label="Display" options={OPTIONS} />)

    await open()

    expect(screen.getByRole('option', { name: 'none' })).toHaveAttribute('data-disabled')
  })

  it('is not reachable when disabled', async () => {
    render(<Select aria-label="Display" options={OPTIONS} disabled />)

    await userEvent.tab()

    expect(screen.getByRole('combobox')).not.toHaveFocus()
  })

  it('exposes the invalid state to assistive technology, not only as a border colour', () => {
    render(<Select aria-label="Display" options={OPTIONS} invalid />)

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('takes its trigger height from the density scale', () => {
    render(<Select aria-label="Display" options={OPTIONS} />)

    expect(screen.getByRole('combobox').className).toContain('h-[26px]')
  })

  it('renders a prefix inside the trigger', () => {
    render(<Select aria-label="Display" options={OPTIONS} prefix={<span data-testid="swatch" />} />)

    expect(screen.getByTestId('swatch')).toBeInTheDocument()
  })

  it('forwards its ref to the trigger', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Select ref={ref} aria-label="Display" options={OPTIONS} />)

    expect(ref.current).toBe(screen.getByRole('combobox'))
  })

  it('keeps the focus-ring replacement for the removed outline', () => {
    render(<Select aria-label="Display" options={OPTIONS} />)
    const className = screen.getByRole('combobox').className

    expect(className).toContain('outline-none')
    expect(className).toContain('focus-visible:shadow-focus')
  })

  it('opts its content into the token-driven overlay animation', async () => {
    render(<Select aria-label="Display" options={OPTIONS} />)

    await open()

    // The entrance is in chrome.css; opting in is all the component is responsible for.
    expect(screen.getByRole('listbox').closest('[data-ms-overlay]')).not.toBeNull()
  })

  it('is axe clean when closed', async () => {
    const { container } = render(<Select aria-label="Display" options={OPTIONS} />)

    await expectNoViolations(container)
  })

  it('is axe clean when open', async () => {
    const { baseElement } = render(<Select aria-label="Display" options={OPTIONS} />)

    await open()

    await expectNoViolations(baseElement)
  })
})
