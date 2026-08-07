import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Switch } from './switch'

const thumbOf = (root: HTMLElement): HTMLElement => {
  const thumb = root.querySelector('[data-state]:not([role])')

  if (!(thumb instanceof HTMLElement)) {
    throw new Error('the switch rendered no thumb')
  }

  return thumb
}

describe('Switch', () => {
  it('renders an unchecked switch by default', () => {
    render(<Switch aria-label="Snap to grid" />)

    expect(screen.getByRole('switch', { name: 'Snap to grid' })).not.toBeChecked()
  })

  it('honours defaultChecked', () => {
    render(<Switch aria-label="Snap to grid" defaultChecked />)

    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('toggles on Space, which is the key this control owns', async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Snap to grid" onCheckedChange={onCheckedChange} />)

    await userEvent.tab()
    expect(screen.getByRole('switch')).toHaveFocus()

    await userEvent.keyboard(' ')

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('toggles on Enter as well, because Radix maps both', async () => {
    render(<Switch aria-label="Snap to grid" />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('toggles back off on a second press', async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Snap to grid" defaultChecked onCheckedChange={onCheckedChange} />)

    await userEvent.click(screen.getByRole('switch'))

    expect(onCheckedChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('stays where the caller put it when controlled', async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Snap to grid" checked={false} onCheckedChange={onCheckedChange} />)

    await userEvent.click(screen.getByRole('switch'))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    // The caller did not re-render with the new value, so the switch must not move on its own.
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('does not toggle when disabled', async () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Snap to grid" disabled onCheckedChange={onCheckedChange} />)

    await userEvent.click(screen.getByRole('switch'))

    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('carries the state on the thumb too, so position and colour cannot disagree', () => {
    render(<Switch aria-label="Snap to grid" defaultChecked />)

    const root = screen.getByRole('switch')

    expect(root).toHaveAttribute('data-state', 'checked')
    expect(thumbOf(root)).toHaveAttribute('data-state', 'checked')
  })

  it('shows its state by position as well as by colour', () => {
    // `ACCESSIBILITY.md` § Non-negotiables 4: colour is never the only carrier of meaning. The thumb's
    // translate is the second carrier, so it is asserted rather than left to the eye.
    render(<Switch aria-label="Snap to grid" defaultChecked />)

    expect(thumbOf(screen.getByRole('switch')).className).toContain(
      'data-[state=checked]:translate-x-[10px]',
    )
  })

  it('paints its on state in value rather than in hue', () => {
    /*
     * ADR-032: the accent is spent on the four things § Character lists, each of which appears at most once
     * in a panel. A switch appears six to ten times, so it inverts to `foreground` instead. The class string
     * is the only place this is observable in jsdom, and it is the thing that would drift.
     */
    render(<Switch aria-label="Snap to grid" />)

    const track = thumbOf(screen.getByRole('switch')).parentElement

    expect(track?.className).toContain('group-data-[state=checked]:bg-foreground')
    expect(track?.className).not.toContain('accent')
  })

  it('hits at 24 × 24 while drawing a 24 × 14 track', () => {
    render(<Switch aria-label="Snap to grid" />)

    const root = screen.getByRole('switch')

    expect(root.className).toContain('h-[24px]')
    expect(root.className).toContain('w-[24px]')
    expect(thumbOf(root).parentElement?.className).toContain('h-[14px]')
  })

  it('animates through the shared transition, which is what makes reduced motion automatic', () => {
    /*
     * The travel is declared in `styles/chrome.css` against `--ms-duration-fast`, which carries both the
     * theme's `motionScale` and the environment's reduced-motion factor (ADR-021). Opting in is the
     * component's whole responsibility; `chrome.test.ts` asserts what the class then does.
     *
     * `travel`, not `control`: the thumb moves to a new position, which § Timing eases on `standard`, and
     * `control` reserves `accelerate` for a press (ADR-033).
     */
    render(<Switch aria-label="Snap to grid" />)

    const thumb = thumbOf(screen.getByRole('switch'))

    expect(thumb.className).toContain('ms-transition-travel')
    expect(thumb.className).not.toMatch(/duration-\[\d/)
  })

  it('keeps the focus-ring replacement for the removed outline', () => {
    render(<Switch aria-label="Snap to grid" />)

    const root = screen.getByRole('switch')

    expect(root.className).toContain('outline-none')
    // The ring is on the track, which is the visible pill rather than the transparent target.
    expect(thumbOf(root).parentElement?.className).toContain('group-focus-visible:shadow-focus')
  })

  it('submits under its name when inside a form', () => {
    // Radix mirrors the switch into a hidden input, but only when there is a form to submit to — it looks
    // for an ancestor `<form>`. Rendering the switch bare is why a name silently does nothing.
    const { container } = render(
      <form>
        <Switch aria-label="Snap to grid" name="snap" value="on" defaultChecked />
      </form>,
    )

    const mirror = container.querySelector('input[name="snap"]')

    expect(mirror).toBeInstanceOf(HTMLInputElement)
    expect(mirror).toBeChecked()
    expect(mirror).toHaveAttribute('value', 'on')
  })

  it('spreads unknown props to its root', () => {
    render(<Switch aria-label="Snap to grid" data-testid="snap" aria-describedby="hint" />)

    expect(screen.getByTestId('snap')).toHaveAttribute('aria-describedby', 'hint')
  })

  it('forwards its ref to the root', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<Switch ref={ref} aria-label="Snap to grid" />)

    expect(ref.current).toBe(screen.getByRole('switch'))
  })

  it('is axe clean', async () => {
    const { container } = render(<Switch aria-label="Snap to grid" />)

    await expectNoViolations(container)
  })
})
