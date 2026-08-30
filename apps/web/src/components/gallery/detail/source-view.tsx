'use client'

import { type TokenKind, tokenize } from '@motion-studio/blocks/highlight'
import { useMemo } from 'react'

/** ADR-124's five colours, as token-backed classes. `plain` inherits and needs none. */
const TOKEN_CLASS: Readonly<Record<TokenKind, string>> = {
  comment: 'text-foreground-muted',
  string: 'text-success',
  number: 'text-info',
  keyword: 'text-accent',
  plain: '',
}

export interface SourceViewProps {
  readonly contents: string
  readonly path: string
}

/**
 * The printed component, highlighted here rather than at build time.
 *
 * `prompts/52` asks for a build-time pass and a lazy highlighter for the rest, which is the right
 * shape for Shiki and the wrong one for ours: ADR-124 replaced Shiki with a 4 kB tokeniser precisely
 * so that highlighting could happen wherever the code does. Splitting this across two mechanisms
 * would add a build step, a generated file per block, and a second code path — to save a fraction of
 * one chunk that is already on the page.
 *
 * The region is focusable with a label, because at 320 px it scrolls and everything past its right
 * edge is otherwise unreachable from a keyboard — the defect ADR-298 found on the landing page, not
 * repeated here. The ring is drawn inside the box because the figure that wraps it is clipped.
 */
export function SourceView({ contents, path }: SourceViewProps) {
  const lines = useMemo(() => contents.split('\n').map((line) => tokenize(line, 'tsx')), [contents])

  return (
    <figure className="m-0 overflow-hidden rounded-xl border border-border bg-surface-1">
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 border-border-subtle border-b px-4 py-2.5">
        <span className="font-mono text-2xs uppercase tracking-[0.14em]" id="source-path">
          {path}
        </span>
        <span className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
          {lines.length} lines · react
        </span>
      </figcaption>

      <pre
        aria-labelledby="source-path"
        className="max-h-[32rem] overflow-auto px-4 py-4 font-mono text-2xs leading-[1.7] focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent-ring sm:text-xs"
        data-testid="block-source"
        // biome-ignore lint/a11y/useSemanticElements: <section> cannot replace <pre> — the white-space handling is what makes the sample readable
        role="region"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable, or the part of the file past its edge is unreachable
        tabIndex={0}
      >
        <code>
          {lines.map((tokens, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a file's lines are identified by their number
            <span className="block" key={index}>
              {tokens.length === 0
                ? ' '
                : tokens.map((token, position) => (
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
