import { type TokenKind, tokenize } from '@motion-studio/blocks/highlight'

import { CopyButton } from '../gallery/detail/copy-button'

import { parseFence } from './docs-fence'

/** ADR-124's five colours, as token-backed classes — the same mapping the gallery's source uses. */
const TOKEN_CLASS: Readonly<Record<TokenKind, string>> = {
  comment: 'text-foreground-muted',
  string: 'text-success',
  number: 'text-info',
  keyword: 'text-accent',
  plain: '',
}

export interface DocsCodeProps {
  readonly info: string | undefined
  readonly source: string
  /** Position in the document, so each region's accessible name is unique on the page. */
  readonly ordinal: number
}

/**
 * Highlighted here, on the server, at build time — ADR-308. The region is focusable and labelled
 * because at 320 px it scrolls, and everything past its right edge is otherwise unreachable from a
 * keyboard (ADR-298).
 */
export function DocsCode({ info, source, ordinal }: DocsCodeProps) {
  const fence = parseFence(info)
  const lines = source.split('\n')
  const highlighted = new Set(fence.highlight)
  const name = fence.filename ?? `${fence.label} sample ${ordinal}`

  return (
    <figure className="my-6 overflow-hidden rounded-lg border border-border bg-surface-1">
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 border-border-subtle border-b px-4 py-2">
        <span className="font-mono text-2xs uppercase tracking-[0.14em]">
          {fence.filename ?? fence.label}
        </span>
        {fence.filename === undefined ? null : (
          <span className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
            {fence.label}
          </span>
        )}
        <span className="ml-auto">
          <CopyButton
            announcement="Code sample copied to the clipboard"
            label="Copy"
            testId="docs-code-copy"
            text={source}
            tone="quiet"
          />
        </span>
      </figcaption>

      <pre
        aria-label={name}
        className="overflow-x-auto py-3 font-mono text-2xs leading-[1.7] focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent-ring sm:text-xs"
        data-testid="docs-code"
        // biome-ignore lint/a11y/useSemanticElements: <section> cannot replace <pre> — the white-space handling is what makes the sample readable
        role="region"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable, or the part of the sample past its edge is unreachable
        tabIndex={0}
      >
        <code>
          {lines.map((line, index) => (
            <span
              className={`block px-4 ${
                highlighted.has(index + 1)
                  ? 'border-accent border-l-2 bg-accent-muted/40 pl-[calc(var(--spacing-4)-2px)]'
                  : ''
              }`}
              // biome-ignore lint/suspicious/noArrayIndexKey: a sample's lines are identified by their number
              key={index}
            >
              {line === ''
                ? ' '
                : tokenize(line, fence.language).map((token, position) => (
                    <span
                      className={TOKEN_CLASS[token.kind]}
                      // biome-ignore lint/suspicious/noArrayIndexKey: tokens are a fixed sequence within a line
                      key={position}
                    >
                      {token.text}
                    </span>
                  ))}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  )
}
