import { ToastProvider } from '@motion-studio/ui'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'
import { CanvasHost } from './canvas-host'

/**
 * The canvas root's boundary, tested by the failure it exists for: the canvas itself throwing while
 * rendering — a transform gone non-finite, a scene subscription that blew up.
 */
vi.mock('@motion-studio/canvas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@motion-studio/canvas')>()),
  Canvas: () => {
    throw new TypeError('viewport transform is not finite')
  },
}))

/** The canvas ports publish toasts, so the host is only mountable inside the studio's provider. */
const renderHost = (): void => {
  render(
    <ToastProvider>
      <CanvasHost />
    </ToastProvider>,
  )
}

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  consoleError.mockRestore()
})

describe('the canvas root boundary', () => {
  it('replaces the canvas with a panel that says what broke', () => {
    renderHost()

    const panel = screen.getByTestId('canvas-error')

    expect(panel).toHaveTextContent('The canvas stopped rendering.')
    expect(panel).toHaveTextContent('viewport transform is not finite')
  })

  /** The rule behind the whole prompt: every boundary offers a way out with the document. */
  it('offers the document download', () => {
    renderHost()

    expect(screen.getByRole('button', { name: 'Download document' })).toBeInTheDocument()
  })

  it('resets the transform when the recovery is taken, because that is the usual cause', async () => {
    useStudioStore.getState().setZoom(2)
    useStudioStore.getState().setPan({ x: 400, y: -120 })

    renderHost()
    await userEvent.click(screen.getByRole('button', { name: 'Reset viewport' }))

    expect(useStudioStore.getState().viewport.zoom).toBe(1)
    expect(useStudioStore.getState().viewport.pan).toEqual({ x: 0, y: 0 })
  })

  it('reports where it caught, so a production log says which boundary spoke', () => {
    renderHost()

    expect(consoleError.mock.calls.map((call) => String(call[0])).join('\n')).toContain('[canvas]')
  })
})
