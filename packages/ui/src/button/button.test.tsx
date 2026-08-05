import { SparklesIcon } from '@motion-studio/icons'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button', () => {
  it('renders its label with the default props', () => {
    render(<Button>Export</Button>)

    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
  })

  it('defaults to type=button, so it cannot submit a form nobody asked it to', () => {
    render(<Button>Duplicate</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('still accepts an explicit type', () => {
    render(<Button type="submit">Save</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('activates on Enter and on Space, which is the button contract', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Reset</Button>)

    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')

    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('is not reachable or clickable when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Export
      </Button>,
    )

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('exposes the disabled state to assistive technology, not just visually', () => {
    render(<Button disabled>Export</Button>)

    // Asserting the accessible state rather than the class string: a variant that only looked disabled
    // would pass a class assertion and fail a user.
    expect(screen.getByRole('button')).toHaveProperty('disabled', true)
  })

  it('renders leading and trailing icons around the label', () => {
    render(
      <Button leadingIcon={<SparklesIcon data-testid="leading" />} trailingIcon={<span>→</span>}>
        Generate
      </Button>,
    )

    expect(screen.getByTestId('leading')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate →' })).toBeInTheDocument()
  })

  it('takes its accessible name from aria-label when it is icon-only', () => {
    render(<Button size="icon" aria-label="Duplicate" leadingIcon={<SparklesIcon />} />)

    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument()
  })

  it('spreads unknown props to the root and forwards its ref', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(
      <Button ref={ref} data-testid="probe" aria-pressed="true">
        Toggle
      </Button>,
    )

    expect(screen.getByTestId('probe')).toBe(ref.current)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    'renders the %s variant',
    (variant) => {
      const { unmount } = render(<Button variant={variant}>Action</Button>)

      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
      unmount()
    },
  )

  it('gives each variant a distinct rendering', () => {
    // Not a class-string assertion for its own sake: four variants that resolved to the same classes would
    // be four names for one button, and nothing else would catch it.
    const classes = (['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => {
      const { container, unmount } = render(<Button variant={variant}>Action</Button>)
      const className = container.querySelector('button')?.className ?? ''
      unmount()

      return className
    })

    expect(new Set(classes).size).toBe(4)
  })

  it.each(['sm', 'md', 'icon'] as const)('takes the %s height from the density scale', (size) => {
    const { container, unmount } = render(
      <Button size={size} aria-label="Action">
        A
      </Button>,
    )

    // Every height comes from density.ts, so each size resolves to one of its arbitrary-value classes.
    expect(container.querySelector('button')?.className).toMatch(/h-\[\d+px\]/)
    unmount()
  })

  it('keeps a focus-ring replacement whenever it removes the outline', () => {
    const { container } = render(<Button>Export</Button>)
    const className = container.querySelector('button')?.className ?? ''

    expect(className).toContain('outline-none')
    expect(className).toContain('focus-visible:shadow-focus')
  })

  it('is axe clean', async () => {
    const { container } = render(<Button>Export</Button>)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('is axe clean when icon-only and labelled', async () => {
    const { container } = render(
      <Button size="icon" aria-label="Duplicate" leadingIcon={<SparklesIcon />} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
