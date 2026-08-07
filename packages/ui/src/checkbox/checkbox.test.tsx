import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Checkbox } from './checkbox'

const boxOf = (root: HTMLElement): HTMLElement => {
  const box = root.firstElementChild

  if (!(box instanceof HTMLElement)) {
    throw new Error('the checkbox rendered no box')
  }

  return box
}

describe('Checkbox', () => {
  it('renders an unchecked checkbox by default', () => {
    render(<Checkbox aria-label="Clip content" />)

    expect(screen.getByRole('checkbox', { name: 'Clip content' })).not.toBeChecked()
  })

  it('honours defaultChecked', () => {
    render(<Checkbox aria-label="Clip content" defaultChecked />)

    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('toggles on Space, which is the key this control owns', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Clip content" onCheckedChange={onCheckedChange} />)

    await userEvent.tab()
    expect(screen.getByRole('checkbox')).toHaveFocus()

    await userEvent.keyboard(' ')

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('does not toggle on Enter, because a checkbox is not a button', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Clip content" onCheckedChange={onCheckedChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('reports the mixed state rather than picking a side', () => {
    // `UI_GUIDELINES.md` § Multi-selection: several nodes selected, the property on for some of them.
    render(<Checkbox aria-label="Clip content" checked="indeterminate" />)

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')
  })

  it('resolves a mixed state to checked on the next press', async () => {
    const onCheckedChange = vi.fn()
    render(
      <Checkbox
        aria-label="Clip content"
        defaultChecked="indeterminate"
        onCheckedChange={onCheckedChange}
      />,
    )

    await userEvent.click(screen.getByRole('checkbox'))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it.each([
    ['indeterminate' as const, 'indeterminate'],
    [true, 'checked'],
  ])('tags the mark with the state it is in: %s', (checked, state) => {
    render(<Checkbox aria-label="Clip content" checked={checked} />)

    expect(document.querySelector('span[data-state]')).toHaveAttribute('data-state', state)
  })

  it('carries two marks, each hidden by the state it does not belong to', () => {
    // The two states paint the same box, so the mark is the only carrier. jsdom applies no stylesheets, so
    // this asserts the wiring and the Storybook walkthrough judges the picture.
    const { container } = render(<Checkbox aria-label="Clip content" checked="indeterminate" />)

    const indicator = container.querySelector('span[data-state]')
    const marks = [...container.querySelectorAll('svg')].map((svg) => svg.getAttribute('class'))

    expect(indicator?.className).toContain('group/mark')
    expect(marks).toHaveLength(2)
    expect(marks).toContain('group-data-[state=indeterminate]/mark:hidden')
    expect(marks).toContain('group-data-[state=checked]/mark:hidden')
  })

  it('renders no mark at all when it is off', () => {
    const { container } = render(<Checkbox aria-label="Clip content" />)

    // Radix mounts the indicator only when there is something to indicate.
    expect(container.querySelector('svg')).toBeNull()
  })

  it('stays where the caller put it when controlled', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Clip content" checked={false} onCheckedChange={onCheckedChange} />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('does not toggle when disabled', async () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Clip content" disabled onCheckedChange={onCheckedChange} />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('hits at 24 × 24 while drawing a 16 × 16 box', () => {
    render(<Checkbox aria-label="Clip content" />)

    const root = screen.getByRole('checkbox')

    expect(root.className).toContain('h-[24px]')
    expect(root.className).toContain('w-[24px]')
    expect(boxOf(root).className).toContain('h-[16px]')
  })

  it('fills in value rather than in hue', () => {
    // ADR-032. One inspector row per boolean property means many of these on screen at once.
    render(<Checkbox aria-label="Clip content" />)

    const box = boxOf(screen.getByRole('checkbox'))

    expect(box.className).toContain('group-data-[state=checked]:bg-foreground')
    expect(box.className).not.toContain('accent')
  })

  it('opts into the shared control transition rather than its own', () => {
    // ADR-033: one `transition` per element. A second utility here would silently discard the first.
    render(<Checkbox aria-label="Clip content" />)

    const box = boxOf(screen.getByRole('checkbox'))

    expect(box.className).toContain('ms-transition-control')
    expect(box.className).not.toMatch(/duration-\[\d/)
  })

  it('keeps the focus-ring replacement for the removed outline', () => {
    render(<Checkbox aria-label="Clip content" />)

    const root = screen.getByRole('checkbox')

    expect(root.className).toContain('outline-none')
    expect(boxOf(root).className).toContain('group-focus-visible:shadow-focus')
  })

  it('submits under its name when inside a form', () => {
    const { container } = render(
      <form>
        <Checkbox aria-label="Clip content" name="clip" value="on" defaultChecked />
      </form>,
    )

    const mirror = container.querySelector('input[name="clip"]')

    expect(mirror).toBeInstanceOf(HTMLInputElement)
    expect(mirror).toBeChecked()
  })

  it('spreads unknown props to its root', () => {
    render(<Checkbox aria-label="Clip content" data-testid="clip" aria-describedby="hint" />)

    expect(screen.getByTestId('clip')).toHaveAttribute('aria-describedby', 'hint')
  })

  it('forwards its ref to the root', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Checkbox ref={ref} aria-label="Clip content" />)

    expect(ref.current).toBe(screen.getByRole('checkbox'))
  })

  it('is axe clean', async () => {
    const { container } = render(<Checkbox aria-label="Clip content" />)

    await expectNoViolations(container)
  })

  it('is axe clean in the mixed state', async () => {
    const { container } = render(<Checkbox aria-label="Clip content" checked="indeterminate" />)

    await expectNoViolations(container)
  })
})
