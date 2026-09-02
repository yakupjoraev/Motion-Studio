'use client'

import { Button } from '@motion-studio/ui'

import { DownloadDocumentButton } from './download-document-button'
import { ErrorDetails } from './error-details'

export interface CanvasErrorPanelProps {
  readonly report: string
  readonly message: string
  /** The recovery that fixes the common cause: a viewport transform that went non-finite. */
  readonly onResetViewport: () => void
  readonly onRetry: () => void
}

/**
 * The canvas root's fallback — ARCHITECTURE.md § Error boundaries.
 *
 * Wider than a node card because the loss is wider: there is no artboard to stand beside, so this
 * takes the whole surface and leads with the way out. The order of the actions is the order to try
 * them in — reset the thing most likely to be at fault, then get the document out, then reload.
 *
 * A reload is offered last and honestly: it is what a user would do anyway, and after the download
 * it costs nothing.
 */
export function CanvasErrorPanel({
  report,
  message,
  onResetViewport,
  onRetry,
}: CanvasErrorPanelProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 p-8"
      data-testid="canvas-error"
      role="alert"
    >
      <div className="flex max-w-md flex-col gap-2 text-center">
        <p className="font-medium text-danger text-sm">The canvas stopped rendering. {message}</p>
        <p className="text-foreground-muted text-xs">
          Your document is still in this browser. Download it before reloading.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <DownloadDocumentButton variant="primary" />
        <Button onClick={onResetViewport} size="sm" variant="secondary">
          Reset viewport
        </Button>
        <Button onClick={onRetry} size="sm" variant="ghost">
          Try again
        </Button>
        <Button onClick={() => window.location.reload()} size="sm" variant="ghost">
          Reload
        </Button>
      </div>

      <div className="w-full max-w-md">
        <ErrorDetails report={report} />
      </div>
    </div>
  )
}
