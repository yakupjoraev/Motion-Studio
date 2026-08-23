import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DownloadActions, archiveName } from './download-actions'

const FILES = [
  { path: 'app/page.tsx', contents: 'export default function Page() {}' },
  { path: 'package.json', contents: '{}' },
]

describe('archiveName', () => {
  it('is the document, kebab-cased, and the day', () => {
    expect(archiveName('Hero Page', new Date('2026-08-23T10:00:00Z'))).toBe(
      'hero-page-2026-08-23.zip',
    )
  })

  it('falls back to a name rather than emitting a bare date', () => {
    expect(archiveName('', new Date('2026-08-23T10:00:00Z'))).toBe('export-2026-08-23.zip')
  })
})

describe('DownloadActions', () => {
  it('copies every file through the caller', async () => {
    const user = userEvent.setup()
    const onCopyAll = vi.fn()

    render(
      <DownloadActions
        disabled={false}
        documentName="Hero Page"
        files={FILES}
        onCopyAll={onCopyAll}
        selected={FILES[0] ?? null}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Copy all' }))

    expect(onCopyAll).toHaveBeenCalledTimes(1)
  })

  it('offers no download of a file nothing is showing', () => {
    render(
      <DownloadActions
        disabled={false}
        documentName="Hero Page"
        files={FILES}
        onCopyAll={vi.fn()}
        selected={null}
      />,
    )

    expect(screen.getByRole('button', { name: /Download file/ })).toBeDisabled()
  })

  it('disables every action while there is nothing to act on', () => {
    render(
      <DownloadActions
        disabled
        documentName="Hero Page"
        files={[]}
        onCopyAll={vi.fn()}
        selected={null}
      />,
    )

    for (const name of ['Copy all', /Download file/, /Download \.zip/]) {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    }
  })
})
