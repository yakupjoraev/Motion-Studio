'use client'

import type { TokenFormat } from '@motion-studio/theme'
import { Button } from '@motion-studio/ui'
import { useState } from 'react'

export interface TokenFormatPanelProps {
  readonly format: TokenFormat
  readonly source: string
}

const download = (format: TokenFormat, source: string): void => {
  const url = URL.createObjectURL(new Blob([source], { type: format.mediaType }))
  const link = document.createElement('a')

  link.href = url
  link.download = format.filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * One format's output, with the two things a user does with it. The code block is a labelled
 * `role="region"` with `tabindex="0"` so it can be scrolled from the keyboard — `ACCESSIBILITY.md`
 * § Dialogs states that requirement for this dialog by name.
 */
export function TokenFormatPanel({ format, source }: TokenFormatPanelProps) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-foreground-muted text-xs">{format.filename}</p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              void navigator.clipboard.writeText(source).then(() => setCopied(true))
            }}
            size="sm"
            variant="secondary"
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button onClick={() => download(format, source)} size="sm" variant="secondary">
            Download
          </Button>
        </div>
      </div>

      {/*
        A focusable region, because a scrollable box that cannot be reached by keyboard cannot be
        scrolled by one — `ACCESSIBILITY.md` § Dialogs requires exactly this of the export dialog's
        code blocks.
      */}
      <section
        aria-label={`${format.label} output`}
        className="max-h-[46vh] overflow-auto rounded-md border border-border bg-surface-inset"
        data-testid={`token-format-${format.id}`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the region is scrollable, see above
        tabIndex={0}
      >
        <pre className="p-3 font-mono text-[11px] leading-relaxed">{source}</pre>
      </section>
    </div>
  )
}
