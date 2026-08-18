import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { ModalTrigger } from './modal-trigger'
import { modalTriggerDefinition as definition } from './modal-trigger.definition'
import { PREVIEW_LABEL } from './modal-trigger.schema'

const defaults = definition.defaults

const open = async (): Promise<HTMLElement> => {
  await userEvent.click(screen.getByRole('button', { name: defaults.triggerLabel }))

  return screen.getByRole('dialog')
}

describe('ModalTrigger', () => {
  it('is a button beside a labelled preview frame, with no dialog until it is asked for', () => {
    renderBlock(definition, ModalTrigger)

    expect(screen.getByRole('button', { name: defaults.triggerLabel })).toBeInTheDocument()
    expect(screen.getByText(PREVIEW_LABEL)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  /* ADR-205: the dialog renders *inside* the block, which is what keeps it off the editor's canvas. */
  it('portals the dialog into its own frame rather than to the body', async () => {
    renderBlock(definition, ModalTrigger)

    const dialog = await open()

    expect(screen.getByTestId('modal-frame')).toContainElement(dialog)
    expect(screen.getByTestId('modal-overlay').className).toContain('absolute')
  })

  it('is labelled by its title and described by its description', async () => {
    renderBlock(definition, ModalTrigger)

    const dialog = await open()

    expect(dialog).toHaveAccessibleName(defaults.title)
    expect(dialog).toHaveAccessibleDescription(defaults.description)
  })

  it('moves focus into the dialog and traps it there', async () => {
    render(
      <>
        <ModalTrigger {...defaults} />
        <button type="button">Outside</button>
      </>,
    )

    const dialog = await open()

    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    })

    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()

    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    // Queried by text rather than by role: the button is `aria-hidden` while the dialog is open, which is
    // exactly what the next two tests are about, and a role query would not find it at all.
    expect(screen.getByText('Outside')).not.toHaveFocus()
  })

  it('closes on Esc and gives the trigger its focus back', async () => {
    renderBlock(definition, ModalTrigger)

    await open()
    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(screen.getByRole('button', { name: defaults.triggerLabel })).toHaveFocus()
  })

  it('closes from a close button that has a real name rather than a glyph', async () => {
    renderBlock(definition, ModalTrigger)

    await open()
    await userEvent.click(screen.getByRole('button', { name: defaults.closeLabel }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('hides the page behind it from assistive technology', async () => {
    render(
      <>
        <ModalTrigger {...defaults} />
        <div data-testid="behind">the page</div>
      </>,
    )

    await open()

    /*
     * The element itself rather than its parent: the dialog is portalled *inside* this block, so the walk
     * `aria-hidden` performs keeps the container as an ancestor of the content and hides the container's other
     * children one by one. Portalled to the body — which is what the export does — the whole subtree beside the
     * dialog is hidden in one go instead.
     */
    expect(screen.getByTestId('behind')).toHaveAttribute('aria-hidden', 'true')
  })

  /*
   * The clause ACCESSIBILITY.md § Dialogs adds to the rule above, and the one that is easy to get wrong: an
   * announcer inside an `aria-hidden` subtree goes silent. `hideOthers` adds every `[aria-live]` element to its
   * keep set, so it does not — asserted here beside a plain element that *is* hidden, which is what makes the
   * pair meaningful rather than a tautology. ADR-209 has the measurement.
   */
  it('leaves a live-region announcer reachable while hiding the page around it', async () => {
    render(
      <>
        <ModalTrigger {...defaults} />
        <output aria-live="polite" data-testid="announcer" />
        <div data-testid="ordinary">not a live region</div>
      </>,
    )

    await open()

    expect(screen.getByTestId('announcer')).not.toHaveAttribute('aria-hidden')
    expect(screen.getByTestId('ordinary')).toHaveAttribute('aria-hidden', 'true')
  })

  it('opens on load when it is told to, which is what the thumbnail shows', () => {
    renderBlock(definition, ModalTrigger, { defaultOpen: true })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  describe('the content', () => {
    it('is the block’s own text until something is dropped in', async () => {
      renderBlock(definition, ModalTrigger)

      const dialog = await open()

      expect(dialog.textContent).toContain(defaults.body)
    })

    it('is the child when there is one', () => {
      renderBlock(definition, ModalTrigger, {
        defaultOpen: true,
        children: <div data-testid="dropped">a form</div>,
      })

      expect(screen.getByTestId('dropped')).toBeInTheDocument()
      expect(screen.getByRole('dialog').textContent).not.toContain(defaults.body)
    })
  })

  it.each([
    ['sm', 'max-w-72'],
    ['md', 'max-w-96'],
    ['lg', 'max-w-[32rem]'],
  ] as const)('sizes %s at %s', (size, width) => {
    renderBlock(definition, ModalTrigger, { size, defaultOpen: true })

    expect(screen.getByRole('dialog').className).toContain(width)
  })

  it('hides itself with the responsive visibility class', () => {
    renderBlock(definition, ModalTrigger, { hidden: true })

    expect(screen.getByTestId('modal-trigger').className).toContain('hidden')
  })

  it('has no axe violations, closed or open', async () => {
    const closed = renderBlock(definition, ModalTrigger)

    await expectNoViolations(closed.container)

    const opened = renderBlock(definition, ModalTrigger, { defaultOpen: true })

    await expectNoViolations(opened.container)
  })
})
