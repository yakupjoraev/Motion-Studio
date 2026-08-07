import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Tooltip, TooltipProvider } from './tooltip'

/** Radix requires a provider ancestor; the studio shell mounts one, so every test does too. */
const withProvider = (children: ReactNode): ReactElement => (
  <TooltipProvider delayDuration={0} skipDelayDuration={0}>
    {children}
  </TooltipProvider>
)

const trigger = (): HTMLElement => screen.getByRole('button')

describe('Tooltip', () => {
  it('names the trigger from the label, so an icon button is never anonymous', () => {
    render(
      withProvider(
        <Tooltip label="Undo">
          <button type="button">
            <span aria-hidden>↺</span>
          </button>
        </Tooltip>,
      ),
    )

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('renders the trigger itself rather than a wrapper around it', () => {
    const { container } = render(
      withProvider(
        <Tooltip label="Undo">
          <button type="button" data-testid="trigger" />
        </Tooltip>,
      ),
    )

    // `asChild`: a wrapper would put a non-interactive node in the tab order's way.
    expect(container.firstElementChild).toBe(screen.getByTestId('trigger'))
  })

  it('lets a trigger keep an accessible name it set itself', () => {
    render(
      withProvider(
        <Tooltip label="Undo">
          <button type="button" aria-label="Undo the last change" />
        </Tooltip>,
      ),
    )

    expect(screen.getByRole('button', { name: 'Undo the last change' })).toBeInTheDocument()
  })

  it('shows the hint on hover', async () => {
    render(
      withProvider(
        <Tooltip label="Undo">
          <button type="button" />
        </Tooltip>,
      ),
    )

    await userEvent.hover(trigger())

    await waitFor(() => {
      expect(screen.getAllByText('Undo').length).toBeGreaterThan(0)
    })
  })

  it('shows the hint on keyboard focus, because nothing depends on hover alone', async () => {
    // `ACCESSIBILITY.md` § Non-negotiables 10.
    render(
      withProvider(
        <Tooltip label="Undo">
          <button type="button" />
        </Tooltip>,
      ),
    )

    await userEvent.tab()

    await waitFor(() => {
      expect(screen.getAllByText('Undo').length).toBeGreaterThan(0)
    })
  })

  it('dismisses on Escape', async () => {
    render(
      withProvider(
        <Tooltip label="Undo">
          <button type="button" />
        </Tooltip>,
      ),
    )

    await userEvent.tab()
    await waitFor(() => expect(screen.getAllByText('Undo').length).toBeGreaterThan(0))

    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  })

  it('renders the shortcut with Kbd when it is given one', async () => {
    render(
      withProvider(
        <Tooltip label="Undo" shortcut="Mod+Z">
          <button type="button" />
        </Tooltip>,
      ),
    )

    await userEvent.hover(trigger())

    await waitFor(() => {
      expect(screen.getByText('Ctrl+Z').tagName).toBe('KBD')
    })
  })

  it('renders no key cap when there is no shortcut', async () => {
    const { baseElement } = render(
      withProvider(
        <Tooltip label="Undo">
          <button type="button" />
        </Tooltip>,
      ),
    )

    await userEvent.hover(trigger())
    await waitFor(() => expect(screen.getAllByText('Undo').length).toBeGreaterThan(0))

    expect(baseElement.querySelector('kbd')).toBeNull()
  })

  it('hides the bubble from assistive technology, because it repeats the name', async () => {
    /*
     * ADR-035. With both the label and a description the button announces as "Undo, button, Undo"; the
     * bubble is a visual duplicate of a name that is already spoken.
     */
    const { baseElement } = render(
      withProvider(
        <Tooltip label="Undo" shortcut="Mod+Z">
          <button type="button" />
        </Tooltip>,
      ),
    )

    await userEvent.hover(trigger())

    await waitFor(() => {
      expect(baseElement.querySelector('[data-ms-overlay="tooltip"]')).toHaveAttribute(
        'aria-hidden',
      )
    })
  })

  it('opts its bubble into the token-driven overlay animation', async () => {
    const { baseElement } = render(
      withProvider(
        <Tooltip label="Undo">
          <button type="button" />
        </Tooltip>,
      ),
    )

    await userEvent.hover(trigger())

    await waitFor(() => {
      // The 120 ms fade is declared in `styles/chrome.css` against `--ms-duration-fast`, which carries the
      // theme's motion scale and the environment's reduced-motion factor both (ADR-021).
      expect(baseElement.querySelector('[data-ms-overlay="tooltip"]')).not.toBeNull()
    })
  })

  it('honours a controlled open state', () => {
    const onOpenChange = vi.fn()
    render(
      withProvider(
        <Tooltip label="Undo" open onOpenChange={onOpenChange}>
          <button type="button" />
        </Tooltip>,
      ),
    )

    expect(screen.getAllByText('Undo').length).toBeGreaterThan(0)
  })

  it('is axe clean with the bubble open', async () => {
    const { baseElement } = render(
      withProvider(
        <Tooltip label="Undo" shortcut="Mod+Z" open>
          <button type="button" />
        </Tooltip>,
      ),
    )

    await expectNoViolations(baseElement)
  })
})
