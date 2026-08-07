import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Slider } from './slider'

describe('Slider', () => {
  it('renders one thumb carrying the slider role and its bounds', () => {
    render(<Slider aria-label="Opacity" defaultValue={72} />)

    const thumb = screen.getByRole('slider', { name: 'Opacity' })

    expect(thumb).toHaveAttribute('aria-valuenow', '72')
    expect(thumb).toHaveAttribute('aria-valuemin', '0')
    expect(thumb).toHaveAttribute('aria-valuemax', '100')
  })

  it('defaults to the low end when the caller gives no value', () => {
    render(<Slider aria-label="Opacity" />)

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0')
  })

  it('takes the caller bounds', () => {
    render(<Slider aria-label="Blur" min={4} max={64} defaultValue={16} />)

    const thumb = screen.getByRole('slider')

    expect(thumb).toHaveAttribute('aria-valuemin', '4')
    expect(thumb).toHaveAttribute('aria-valuemax', '64')
  })

  it('steps up and down with the arrow keys, which are the keys this control owns', async () => {
    const onValueChange = vi.fn()
    render(<Slider aria-label="Opacity" defaultValue={50} onValueChange={onValueChange} />)

    await userEvent.tab()
    expect(screen.getByRole('slider')).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith(51)

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(onValueChange).toHaveBeenLastCalledWith(49)
  })

  it('steps by the caller step, not by one', async () => {
    const onValueChange = vi.fn()
    render(
      <Slider
        aria-label="Blur"
        min={0}
        max={64}
        step={8}
        defaultValue={16}
        onValueChange={onValueChange}
      />,
    )

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(onValueChange).toHaveBeenLastCalledWith(24)
  })

  it('jumps to the ends with Home and End', async () => {
    const onValueChange = vi.fn()
    render(<Slider aria-label="Opacity" defaultValue={50} onValueChange={onValueChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{Home}')
    expect(onValueChange).toHaveBeenLastCalledWith(0)

    await userEvent.keyboard('{End}')
    expect(onValueChange).toHaveBeenLastCalledWith(100)
  })

  it('reports a single number, not the array Radix works in', async () => {
    const onValueChange = vi.fn()
    render(<Slider aria-label="Opacity" defaultValue={50} onValueChange={onValueChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(onValueChange.mock.calls[0]?.[0]).toBe(51)
    expect(Array.isArray(onValueChange.mock.calls[0]?.[0])).toBe(false)
  })

  it('commits once when the key is released, which is the edge history records', async () => {
    const onValueCommit = vi.fn()
    render(<Slider aria-label="Opacity" defaultValue={50} onValueCommit={onValueCommit} />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')

    // Three steps, three commits — one per keystroke, and each one a number rather than an array.
    expect(onValueCommit).toHaveBeenCalledTimes(3)
    expect(onValueCommit).toHaveBeenLastCalledWith(53)
  })

  it('stays where the caller put it when controlled', async () => {
    const onValueChange = vi.fn()
    render(<Slider aria-label="Opacity" value={50} onValueChange={onValueChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(onValueChange).toHaveBeenCalledWith(51)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '50')
  })

  it('is not reachable or operable when disabled', async () => {
    const onValueChange = vi.fn()
    render(<Slider aria-label="Opacity" defaultValue={50} disabled onValueChange={onValueChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('slider')).not.toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('announces the unit when the caller supplies one', () => {
    // `ACCESSIBILITY.md` § Inspector: "16 pixels", not "16".
    render(<Slider aria-label="Blur" defaultValue={16} aria-valuetext="16 pixels" />)

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '16 pixels')
  })

  it('sits in a control row and draws a 4px well', () => {
    const { container } = render(<Slider aria-label="Opacity" defaultValue={50} />)

    expect(container.firstElementChild?.className).toContain('h-[28px]')
    expect(container.querySelector('.rounded-full.bg-surface-inset')?.className).toContain(
      'h-[4px]',
    )
  })

  it('reaches a 24 × 24 target from a 12 px knob', () => {
    // ADR-030: the target is padded by a transparent `::after`, not produced by growing the visible circle.
    render(<Slider aria-label="Opacity" defaultValue={50} />)
    const thumb = screen.getByRole('slider')

    expect(thumb.className).toContain('h-[12px]')
    expect(thumb.className).toContain('after:-inset-[6px]')
  })

  it('fills in value rather than in hue', () => {
    // ADR-032, the same inversion the switch uses. A slider per property means ten fills at rest.
    const { container } = render(<Slider aria-label="Opacity" defaultValue={50} />)

    const range = container.querySelector('.absolute.h-full')

    expect(range?.className).toContain('bg-foreground')
    expect(range?.className).not.toContain('accent')
  })

  it('does not transition the fill, because it follows the pointer', () => {
    // ADR-031: a transition puts the bar a fixed 120 ms behind the number beside it for the whole drag.
    const { container } = render(<Slider aria-label="Opacity" defaultValue={50} />)

    expect(container.querySelector('.absolute.h-full')?.className).not.toContain('transition')
    expect(container.querySelector('.absolute.h-full')?.className).not.toContain('ms-transition')
  })

  it('keeps the focus-ring replacement for the removed outline', () => {
    render(<Slider aria-label="Opacity" defaultValue={50} />)
    const className = screen.getByRole('slider').className

    expect(className).toContain('outline-none')
    expect(className).toContain('focus-visible:shadow-focus')
  })

  it('forwards its ref to the root', () => {
    const ref = { current: null as HTMLSpanElement | null }
    const { container } = render(<Slider ref={ref} aria-label="Opacity" defaultValue={50} />)

    expect(ref.current).toBe(container.firstElementChild)
  })

  it('is axe clean', async () => {
    const { container } = render(<Slider aria-label="Opacity" defaultValue={50} />)

    await expectNoViolations(container)
  })
})
