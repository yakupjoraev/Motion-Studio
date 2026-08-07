import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '../button/button'
import { expectNoViolations } from '../test/axe'

import { Dialog } from './dialog'

import type { DialogProps } from './dialog.types'

const Fixture = (props: Partial<DialogProps>): ReactElement => (
  <Dialog
    title="Delete Hero"
    description="The block and its children are removed. This can be undone."
    trigger={<button type="button">Delete</button>}
    footer={<Button variant="danger">Confirm delete</Button>}
    {...props}
  />
)

const openIt = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
}

describe('Dialog', () => {
  it('renders only the trigger while closed', () => {
    render(<Fixture />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on click, named and described', async () => {
    // `ACCESSIBILITY.md` § Dialogs asks for both, and neither is optional in this component's props.
    render(<Fixture />)

    await openIt()

    const dialog = screen.getByRole('dialog', { name: 'Delete Hero' })

    expect(dialog).toHaveAccessibleDescription(
      'The block and its children are removed. This can be undone.',
    )
  })

  it('traps focus and puts it inside on open', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  })

  it('restores focus to the trigger on close', async () => {
    render(<Fixture />)

    await openIt()
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus()
  })

  it('closes on Escape', async () => {
    render(<Fixture />)

    await openIt()
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes from a close button that has a real label', async () => {
    render(<Fixture />)

    await openIt()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps Tab inside the dialog', async () => {
    render(
      <>
        <Fixture />
        <button type="button">Outside</button>
      </>,
    )

    await openIt()
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()

    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  })

  it('hides the background from assistive technology', async () => {
    render(
      <>
        <Fixture />
        <div data-testid="behind">canvas</div>
      </>,
    )

    await openIt()

    expect(screen.getByTestId('behind').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it.each([
    ['sm', '320px'],
    ['md', '640px'],
    ['lg', '960px'],
  ] as const)('sizes %s at %s', async (size, width) => {
    render(<Fixture size={size} />)

    await openIt()

    expect(screen.getByRole('dialog').className).toContain(`max-w-[${width}]`)
  })

  it('defaults to the form size, because a confirmation is the narrower case', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('dialog').className).toContain('max-w-[640px]')
  })

  it('bounds its height so its own buttons stay reachable', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('dialog').className).toContain('max-h-[calc(100vh-64px)]')
  })

  it('takes the 220ms entrance § Timing gives dialogs and nothing else', async () => {
    render(<Fixture />)

    await openIt()

    expect(screen.getByRole('dialog')).toHaveAttribute('data-ms-overlay', 'dialog')
  })

  it('renders a footer only when it is given one', async () => {
    render(<Fixture footer={undefined} />)

    await openIt()

    expect(screen.queryByRole('button', { name: 'Confirm delete' })).not.toBeInTheDocument()
    // The dialog is still there — it is the action row that is absent, not the panel.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('reports every open and close to the caller', async () => {
    const onOpenChange = vi.fn()
    render(<Fixture onOpenChange={onOpenChange} />)

    await openIt()
    await userEvent.keyboard('{Escape}')

    expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false])
  })

  it('opens without a trigger when the caller drives it', () => {
    render(<Fixture trigger={undefined} open />)

    expect(screen.getByRole('dialog', { name: 'Delete Hero' })).toBeInTheDocument()
  })

  it('is axe clean when open', async () => {
    const { baseElement } = render(
      <Fixture open trigger={undefined}>
        {'body'}
      </Fixture>,
    )

    await expectNoViolations(baseElement)
  })
})
