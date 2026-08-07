import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Collapsible } from './collapsible'

import type { CollapsibleProps } from './collapsible.types'

const Fixture = (props: Partial<CollapsibleProps>): ReactElement => (
  <Collapsible trigger="Layout" {...props}>
    <p>Display, direction, gap</p>
  </Collapsible>
)

const header = (): HTMLElement => screen.getByRole('button', { name: /Layout/ })

describe('Collapsible', () => {
  it('renders a header that reports it is closed', () => {
    render(<Fixture />)

    expect(header()).toHaveAttribute('aria-expanded', 'false')
  })

  it('points aria-controls at the section it opens', () => {
    // `ACCESSIBILITY.md` § Inspector asks for both attributes by name.
    render(<Fixture defaultOpen />)

    const controlled = header().getAttribute('aria-controls')

    expect(controlled).not.toBeNull()
    expect(document.getElementById(controlled ?? '')).toHaveTextContent('Display, direction, gap')
  })

  it('opens on click', async () => {
    render(<Fixture />)

    await userEvent.click(header())

    expect(header()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Display, direction, gap')).toBeVisible()
  })

  it.each(['{Enter}', ' '])('opens on %s from the keyboard', async (key) => {
    render(<Fixture />)

    await userEvent.tab()
    expect(header()).toHaveFocus()

    await userEvent.keyboard(key)

    expect(header()).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes again on a second press', async () => {
    render(<Fixture defaultOpen />)

    await userEvent.click(header())

    expect(header()).toHaveAttribute('aria-expanded', 'false')
  })

  it('reports every change to the caller, because persistence is the app’s concern', async () => {
    const onOpenChange = vi.fn()
    render(<Fixture onOpenChange={onOpenChange} />)

    await userEvent.click(header())

    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('stays where the caller put it when controlled', async () => {
    const onOpenChange = vi.fn()
    render(<Fixture open={false} onOpenChange={onOpenChange} />)

    await userEvent.click(header())

    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(header()).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not open when disabled', async () => {
    const onOpenChange = vi.fn()
    render(<Fixture disabled onOpenChange={onOpenChange} />)

    await userEvent.click(header())

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('takes its header height from the density scale and sticks it to the top', () => {
    render(<Fixture />)

    expect(header().className).toContain('h-[32px]')
    expect(header().className).toContain('sticky')
  })

  it('turns one chevron rather than swapping two glyphs', () => {
    const { container } = render(<Fixture defaultOpen />)

    const marks = container.querySelectorAll('svg')

    expect(marks).toHaveLength(1)
    expect(marks[0]?.getAttribute('class')).toContain('group-data-[state=open]:rotate-90')
  })

  it('opts its content into the height animation, and clips it while it runs', async () => {
    /*
     * Height cannot be transitioned from `auto`, so the keyframes in `styles/chrome.css` read the height
     * Radix measures. `overflow-hidden` is what makes that a collapse rather than a wipe over spilling text.
     */
    render(<Fixture defaultOpen />)

    const content = document.querySelector('[data-ms-collapsible]')

    expect(content).not.toBeNull()
    expect(content?.className).toContain('overflow-hidden')
  })

  it('takes classes for the frame, the header and the section separately', () => {
    const { container } = render(
      <Fixture
        defaultOpen
        className="border-b"
        triggerClassName="uppercase"
        contentClassName="p-2"
      />,
    )

    expect(container.firstElementChild?.className).toContain('border-b')
    expect(header().className).toContain('uppercase')
    expect(document.querySelector('[data-ms-collapsible]')?.className).toContain('p-2')
  })

  it('forwards its ref to the root', () => {
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(
      <Collapsible ref={ref} trigger="Layout">
        <p>Display</p>
      </Collapsible>,
    )

    expect(ref.current).toBe(container.firstElementChild)
  })

  it('is axe clean', async () => {
    const { container } = render(<Fixture defaultOpen />)

    await expectNoViolations(container)
  })
})
