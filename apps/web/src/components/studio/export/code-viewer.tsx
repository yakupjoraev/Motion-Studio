'use client'

import type { ExportFile } from '@motion-studio/codegen'
import { CheckIcon, CopyIcon } from '@motion-studio/icons'
import { Button, Skeleton } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'
import { useEffect, useMemo, useState } from 'react'

type Highlighter = typeof import('@motion-studio/blocks/highlight')
type Language = Parameters<Highlighter['tokenize']>[1]
type Token = ReturnType<Highlighter['tokenize']>[number]

export interface CodeViewerProps {
  readonly file: ExportFile | null
  /** `false` while Prettier is still on this file — the panel shows its shape rather than moving text. */
  readonly ready: boolean
  readonly onCopy: (file: ExportFile) => void
  /** The truncation point. A prop so a test can drive it at a size a test can read. */
  readonly maxLines?: number
}

/** UI_GUIDELINES.md § Timing: long enough to read, then out of the way. */
const CONFIRMATION_MS = 1_200

/** Past this the panel truncates. Highlighting a hundred thousand lines to scroll ten is the freeze. */
export const MAX_LINES = 2_000

/** `leading-5` in pixels: the skeleton has to be the height the text will be. */
const LINE_HEIGHT = 20

const EXTENSIONS: Readonly<Record<string, Language>> = {
  ts: 'ts',
  tsx: 'tsx',
  js: 'js',
  mjs: 'js',
  jsx: 'jsx',
  json: 'json',
  css: 'css',
  html: 'html',
  sh: 'bash',
}

export const languageOf = (path: string): Language =>
  EXTENSIONS[path.slice(path.lastIndexOf('.') + 1).toLowerCase()] ?? 'plain'

/** The chrome's palette for the shared tokeniser — ADR-245. The kinds are its; the colours are ours. */
const TOKEN_CLASS: Readonly<Record<string, string>> = {
  comment: 'text-foreground-subtle italic',
  string: 'text-success',
  number: 'text-warning',
  keyword: 'text-accent',
  plain: 'text-foreground',
}

let loading: Promise<Highlighter> | null = null

const load = (): Promise<Highlighter> => {
  loading ??= import('@motion-studio/blocks/highlight')

  return loading
}

/**
 * The generated file, highlighted by the catalogue's own tokeniser — ADR-245, dynamically imported so
 * it is a chunk of its own. The region is focusable and labelled because it scrolls: a panel a
 * keyboard cannot reach is a panel whose second half nobody can read — ACCESSIBILITY.md § Scrollable
 * regions.
 */
export function CodeViewer({ file, ready, onCopy, maxLines = MAX_LINES }: CodeViewerProps) {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)
  const [copied, setCopied] = useState(false)
  const [wrap, setWrap] = useState(false)

  useEffect(() => {
    let live = true

    void load().then((module) => {
      if (live) {
        setHighlighter(module)
      }
    })

    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = setTimeout(() => setCopied(false), CONFIRMATION_MS)

    return () => clearTimeout(timer)
  }, [copied])

  const lines = useMemo<readonly (readonly Token[])[]>(() => {
    if (file === null) {
      return []
    }

    // Before the tokeniser's chunk lands the file is shown as plain text rather than as nothing: the
    // code is the point of the panel, and the colours are how it reads, not whether it is there.
    if (highlighter === null) {
      return file.contents
        .split('\n')
        .slice(0, maxLines)
        .map((line) => [{ kind: 'plain', text: line }] as readonly Token[])
    }

    const language = languageOf(file.path)

    return file.contents
      .split('\n')
      .slice(0, maxLines)
      .map((line) => highlighter.tokenize(line, language))
  }, [file, highlighter, maxLines])

  if (file === null) {
    return (
      <p className="p-2 text-2xs text-foreground-subtle" data-testid="export-viewer-empty">
        Pick a file to read it.
      </p>
    )
  }

  const count = file.contents.split('\n').length
  const truncated = count > maxLines

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{file.path}</span>

        <Button
          aria-pressed={wrap}
          onClick={() => setWrap((current) => !current)}
          size="sm"
          variant="ghost"
        >
          Wrap
        </Button>

        <Button
          leadingIcon={copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          onClick={() => {
            onCopy(file)
            setCopied(true)
          }}
          size="sm"
          variant="ghost"
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {ready ? (
        <section
          aria-label={`${file.path}, generated code`}
          className="min-h-0 flex-1 overflow-auto rounded-sm border border-border bg-surface-0 p-2 outline-none focus-visible:shadow-focus"
          data-testid="export-code-viewer"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable, or the part of the file below the fold is unreachable from the keyboard
          tabIndex={0}
        >
          <pre className={cn('font-mono text-2xs leading-5', wrap ? 'whitespace-pre-wrap' : '')}>
            <code>
              {lines.map((tokens, index) => (
                // The line number is the line's identity: contents repeat, positions do not.
                // biome-ignore lint/suspicious/noArrayIndexKey: the index is the line number
                <span className="block" key={index}>
                  <span
                    aria-hidden
                    className="inline-block w-9 shrink-0 select-none pr-3 text-right text-foreground-subtle"
                  >
                    {index + 1}
                  </span>
                  {tokens.map((token, position) => (
                    <span
                      className={TOKEN_CLASS[token.kind] ?? TOKEN_CLASS['plain']}
                      // biome-ignore lint/suspicious/noArrayIndexKey: a token is identified by where it is on the line
                      key={position}
                    >
                      {token.text}
                    </span>
                  ))}
                </span>
              ))}
            </code>
          </pre>

          {truncated ? (
            <p className="pt-2 text-2xs text-warning" data-testid="export-truncated">
              {`Showing the first ${maxLines} of ${count} lines. Download the file to read all of it.`}
            </p>
          ) : null}
        </section>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border bg-surface-0 p-2">
          {/* The height is the file's own line count — § Loading and empty states asks for the final
              size, and the printed file already knows it before Prettier has been over it. */}
          <Skeleton
            data-testid="export-viewer-skeleton"
            height={Math.min(count, maxLines) * LINE_HEIGHT}
            shape="rect"
          />
        </div>
      )}
    </div>
  )
}
