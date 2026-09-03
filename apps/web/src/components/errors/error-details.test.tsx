import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorDetails } from './error-details'

const REPORT = 'Motion Studio 1.0.0\nTypeError: plans is not an array'

const writeText = vi.fn(() => Promise.resolve())

beforeEach(() => {
  writeText.mockClear()
  writeText.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
})

const open = async (): Promise<void> => {
  render(<ErrorDetails report={REPORT} />)
  await userEvent.click(screen.getByRole('button', { name: /Details/ }))
}

describe('the error details', () => {
  /** UI_GUIDELINES.md § Copy: the stack is needed and is not the message. */
  it('keeps the raw report one click down', async () => {
    render(<ErrorDetails report={REPORT} />)

    expect(screen.queryByText(/plans is not an array/)).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /Details/ }))

    expect(screen.getByText(/plans is not an array/)).toBeInTheDocument()
  })

  it('says that nothing leaves the browser, because a "report" button reads as one that phones home', async () => {
    await open()

    expect(screen.getByText('Nothing is sent automatically.')).toBeInTheDocument()
  })

  it('copies the report and says it did', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Copy report' }))

    expect(writeText).toHaveBeenCalledWith(REPORT)
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  /** A browser can refuse the clipboard outright; a button that then does nothing is worse. */
  it('stays offering the copy when the browser refuses the clipboard', async () => {
    writeText.mockRejectedValue(new DOMException('denied', 'NotAllowedError'))

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Copy report' }))

    expect(screen.getByRole('button', { name: 'Copy report' })).toBeInTheDocument()
  })
})
