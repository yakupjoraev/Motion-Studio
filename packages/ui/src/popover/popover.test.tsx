import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Popover } from './popover'

const Fixture = ({ onOpenChange }: { onOpenChange?: (open: boolean) => void }): ReactElement => (
  <Popover
    label="Presets"
    trigger={<button type="button">Open</button>}
    {...(onOpenChange === undefined ? {} : { onOpenChange })}
  >
    <button type="button">Inside</button>
  </Popover>
)

const openIt = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Open' }))
}

describe('Popover', () => {
  it('renders only the trigger while closed', () => {
    render(<Fixture />)

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the trigger itself rather than a wrapper around it', () => {
    const { container } = render(<Fixture />)

    expect(container.firstElementChild).toBe(screen.getByRole('button', { name: 'Open' }))
  })

  it('opens on click and names the panel', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('dialog', { name: 'Presets' })).toBeInTheDocument()
  })

  it('opens on Enter from the keyboard', async () => {
    render(<Fixture />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('moves focus into the panel when it opens', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Fixture />)

    await openIt()
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
  })

  it('closes when the pointer goes elsewhere', async () => {
    render(
      <>
        <Fixture />
        <button type="button">Outside</button>
      </>,
    )

    await openIt()
    await userEvent.click(screen.getByRole('button', { name: 'Outside' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reports every open and close to the caller', async () => {
    const onOpenChange = vi.fn()
    render(<Fixture onOpenChange={onOpenChange} />)

    await openIt()
    await userEvent.keyboard('{Escape}')

    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false])
  })

  it('leaves the page usable behind it, because it is not modal', async () => {
    /*
     * An inspector popover sits beside the canvas and the user keeps working around it. A modal one would
     * inert the page, which is `Dialog`'s job and not this one's.
     */
    render(
      <>
        <Fixture />
        <button type="button">Outside</button>
      </>,
    )

    await openIt()

    expect(screen.getByRole('button', { name: 'Outside' })).not.toHaveAttribute('aria-hidden')
    expect(document.body).not.toHaveAttribute('data-scroll-locked')
  })

  it('honours a controlled open state', () => {
    render(
      <Popover label="Presets" open trigger={<button type="button">Open</button>}>
        content
      </Popover>,
    )

    expect(screen.getByRole('dialog', { name: 'Presets' })).toBeInTheDocument()
  })

  it('opts its panel into the token-driven overlay animation', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('dialog').closest('[data-ms-overlay]')).not.toBeNull()
  })

  it('floats on glass, which § Character allows here and nowhere else in the chrome', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('dialog').className).toContain('backdrop-blur')
  })

  it('is axe clean when open', async () => {
    const { baseElement } = render(<Fixture />)

    await openIt()

    await expectNoViolations(baseElement)
  })
})
