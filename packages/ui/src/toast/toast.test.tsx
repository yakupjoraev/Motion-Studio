import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { ToastProvider, useToast } from './toast'

import type { ToastOptions } from './toast.types'

// Radix Toast reads pointer capture on every press to run its swipe-to-dismiss; jsdom has neither method.
beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
})

const Publisher = ({ options }: { options: ToastOptions }): ReactElement => {
  const toast = useToast()

  return (
    <button type="button" onClick={() => toast(options)}>
      Publish
    </button>
  )
}

const renderWith = (options: ToastOptions, duration?: number): void => {
  render(
    <ToastProvider {...(duration === undefined ? {} : { duration })}>
      <Publisher options={options} />
    </ToastProvider>,
  )
}

const publish = async (): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name: 'Publish' }))
}

describe('useToast', () => {
  it('throws outside a provider, rather than silently dropping the message', () => {
    // A toast that never appears takes the user's Undo with it and says nothing. Failing loudly is kinder.
    const noise = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<Publisher options={{ title: 'Deleted Hero' }} />)).toThrow(/ToastProvider/)

    noise.mockRestore()
  })
})

describe('ToastProvider', () => {
  it('shows nothing until something is published', () => {
    renderWith({ title: 'Deleted Hero' })

    expect(screen.queryByText('Deleted Hero')).not.toBeInTheDocument()
  })

  it('shows a published toast', async () => {
    renderWith({ title: 'Deleted Hero' })

    await publish()

    expect(screen.getByText('Deleted Hero')).toBeInTheDocument()
  })

  it('shows a description when there is one', async () => {
    renderWith({ title: 'Export failed', description: 'The IR had two unresolved nodes.' })

    await publish()

    expect(screen.getByText('The IR had two unresolved nodes.')).toBeInTheDocument()
  })

  it('offers the action and runs it', async () => {
    // § Feedback rules: "every destructive action is undoable, and the toast says so".
    const undo = vi.fn()
    renderWith({ title: 'Deleted Hero', action: { label: 'Undo', onClick: undo } })

    await publish()
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))

    expect(undo).toHaveBeenCalledTimes(1)
  })

  it('renders no action button when there is no action', async () => {
    renderWith({ title: 'Deleted Hero' })

    await publish()

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  it('dismisses from a close button that has a real label', async () => {
    renderWith({ title: 'Deleted Hero' })

    await publish()
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    await waitFor(() => {
      expect(screen.queryByText('Deleted Hero')).not.toBeInTheDocument()
    })
  })

  it('stacks several toasts rather than replacing one with the next', async () => {
    renderWith({ title: 'Deleted Hero' })

    await publish()
    await publish()

    expect(screen.getAllByText('Deleted Hero')).toHaveLength(2)
  })

  it('announces itself, which is the whole point of a toast', async () => {
    // `ACCESSIBILITY.md` § Non-negotiables 8: "live regions announce state changes that are only visible".
    const { baseElement } = render(
      <ToastProvider>
        <Publisher options={{ title: 'Deleted Hero' }} />
      </ToastProvider>,
    )

    await publish()

    expect(baseElement.querySelector('[role="status"], [aria-live]')).not.toBeNull()
  })

  it('carries the tone on the edge rather than across the whole surface', async () => {
    renderWith({ title: 'Export failed', tone: 'danger' })

    await publish()

    const card = screen.getByText('Export failed').closest('[data-ms-toast]')

    expect(card?.className).toContain('border-l-danger')
    expect(card?.className).not.toContain('bg-danger')
  })

  it('opts into the spring entrance § Timing gives a toast', async () => {
    renderWith({ title: 'Deleted Hero' })

    await publish()

    expect(screen.getByText('Deleted Hero').closest('[data-ms-toast]')).not.toBeNull()
  })

  it('dismisses itself after its duration', async () => {
    renderWith({ title: 'Deleted Hero' }, 50)

    await publish()

    await waitFor(
      () => {
        expect(screen.queryByText('Deleted Hero')).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('lets one toast override the provider’s duration', async () => {
    renderWith({ title: 'Deleted Hero', duration: 50 }, 100_000)

    await publish()

    await waitFor(
      () => {
        expect(screen.queryByText('Deleted Hero')).not.toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })

  it('is axe clean with a toast open', async () => {
    const { baseElement } = render(
      <ToastProvider>
        <Publisher
          options={{ title: 'Deleted Hero', action: { label: 'Undo', onClick: () => undefined } }}
        />
      </ToastProvider>,
    )

    await publish()

    await expectNoViolations(baseElement)
  })
})
