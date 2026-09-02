'use client'

import { useEffect } from 'react'

import { DownloadDocumentButton } from '../src/components/errors/download-document-button'
import { ErrorDetails } from '../src/components/errors/error-details'
import { formatErrorReport } from '../src/lib/errors/format-error-report'

export interface RouteErrorProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

/**
 * The route boundary — ARCHITECTURE.md § Error boundaries, the row that says "Next.js `error.tsx`
 * with a link to download the autosaved document".
 *
 * This one runs when a page failed rather than a widget, so the store may never have mounted. The
 * download button handles that: it reads the autosave and the unload lane when the live store is not
 * there, which is precisely the case here.
 */
export default function RouteError({ error, reset }: RouteErrorProps) {
  const report = formatErrorReport({
    error,
    appVersion: '1.0.0',
    ...(error.digest === undefined ? {} : { code: error.digest }),
    document: null,
    ...(typeof navigator === 'undefined' ? {} : { userAgent: navigator.userAgent }),
  })

  useEffect(() => {
    window.console.error(`[route] ${report}`)
  }, [report])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="font-semibold text-2xl">This page stopped working</h1>
      <p className="text-foreground-muted text-sm">
        The page failed to render. Your saved work is untouched — download it here, then try again
        or go back to the blocks.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <DownloadDocumentButton label="Download saved document" variant="primary" />
        <button
          className="h-9 rounded-md border border-border px-3 font-medium text-sm hover:bg-surface-2"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
        <a
          className="h-9 rounded-md border border-border px-3 py-2 font-medium text-sm hover:bg-surface-2"
          href="/blocks"
        >
          Go to blocks
        </a>
      </div>

      <ErrorDetails report={report} />
    </main>
  )
}
