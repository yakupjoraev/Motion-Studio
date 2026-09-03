import { createEmptyDocument, nodeId, serializeDocument } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PENDING_KEY } from '../src/lib/storage/pending-write'
import GlobalError from './global-error'

const document_ = createEmptyDocument({
  name: 'Launch page',
  ids: () => nodeId('node_g1'),
  now: () => new Date(0),
})

let saved: Blob[]
let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  saved = []
  /*
   * Next replaces the whole document with this fallback; a test renders it inside one that already
   * exists, so React reports an `<html>` inside an `<html>`. That is the harness, not the component,
   * and it is the only message swallowed here — anything else still reaches the console.
   */
  const report = console.error

  consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!String(args[0]).includes('cannot be a child of')) {
      report(...args)
    }
  })
  window.localStorage.clear()
  // A hash rather than a `blob:` URL: the anchor is clicked for real, and jsdom implements no
  // navigation other than a hash change.
  URL.createObjectURL = vi.fn((blob: Blob) => {
    saved.push(blob)

    return '#downloaded'
  })
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  window.localStorage.clear()
  consoleError.mockRestore()
})

const view = () =>
  render(<GlobalError error={new TypeError('providers is not iterable')} reset={vi.fn()} />, {
    // The fallback renders its own `<html>`, which is the whole point of it — React is told where it
    // may put one rather than being asked to nest it in a `div`.
    container: window.document.documentElement,
  })

const writeLane = (): void => {
  window.localStorage.setItem(
    PENDING_KEY,
    `{"savedAt":10,"document":${serializeDocument(document_)}}`,
  )
}

describe('the last-resort fallback', () => {
  it('says what happened and shows the error it caught', () => {
    view()

    expect(screen.getByRole('heading', { name: 'Motion Studio could not start' })).toBeVisible()
    expect(screen.getByText(/providers is not iterable/)).toBeInTheDocument()
  })

  /**
   * The lane it reads is written by `pending-write`, by hand rather than through it — a key that
   * drifted apart would leave this fallback reading an empty box on the one screen that has no
   * second chance.
   */
  it('downloads the document the unload lane holds', async () => {
    writeLane()
    view()

    await userEvent.click(screen.getByRole('button', { name: 'Download saved document' }))

    expect(screen.getByText('Downloaded the last saved copy.')).toBeInTheDocument()
    expect(JSON.parse(await (saved[0] as Blob).text())).toMatchObject({
      meta: { name: 'Launch page' },
    })
  })

  it('says so when the browser holds nothing', async () => {
    view()

    await userEvent.click(screen.getByRole('button', { name: 'Download saved document' }))

    expect(screen.getByText('No document was found in this browser.')).toBeInTheDocument()
    expect(saved).toHaveLength(0)
  })

  it('survives a corrupt lane rather than throwing while handling a throw', async () => {
    window.localStorage.setItem(PENDING_KEY, '{"savedAt":10,"document":')
    view()

    await userEvent.click(screen.getByRole('button', { name: 'Download saved document' }))

    expect(screen.getByText('The saved copy could not be read.')).toBeInTheDocument()
  })

  it('says so when the browser refuses local storage', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    view()
    await userEvent.click(screen.getByRole('button', { name: 'Download saved document' }))

    expect(screen.getByText('This browser refused access to local storage.')).toBeInTheDocument()

    getItem.mockRestore()
  })
})
