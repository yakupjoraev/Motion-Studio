import type { Token } from 'marked'

import type { DocHeading } from '../../lib/docs/headings'

import { ArchitectureDiagram, isDependencyGraphFence } from './architecture-diagram'
import { DocsCallout } from './docs-callout'
import { DocsCode } from './docs-code'
import { DocsHeading } from './docs-heading'
import { DocsInline } from './docs-inline'
import { DocsList } from './docs-list'
import { createOrdinals } from './docs-ordinals'
import { DocsTable } from './docs-table'
import { isCode, isHeading, isList, isTable } from './docs-tokens'

export interface DocsContentProps {
  readonly tokens: readonly Token[]
  /** In document order, so a heading token takes the slug the table of contents links to. */
  readonly headings: readonly DocHeading[]
}

/**
 * The block half of the renderer. Its input is `marked`'s token tree (ADR-307) — no HTML string ever
 * exists, which is what lets a heading carry an anchor and a table carry `scope`.
 */
export function DocsContent({ tokens, headings }: DocsContentProps) {
  const ordinals = createOrdinals()
  let heading = 0

  return (
    <div className="text-foreground-muted leading-relaxed">
      {tokens.map((token, index) => {
        const key = `${token.type}-${index}`

        if (isHeading(token)) {
          const current = headings[heading]

          heading += 1

          return current === undefined ? null : (
            <DocsHeading heading={current} key={key} token={token} />
          )
        }

        if (isCode(token)) {
          return isDependencyGraphFence(token.text) ? (
            <ArchitectureDiagram key={key} />
          ) : (
            <DocsCode
              info={token.lang}
              key={key}
              ordinal={ordinals.nextCode()}
              source={token.text}
            />
          )
        }

        if (isTable(token)) {
          return <DocsTable key={key} ordinal={ordinals.nextTable()} token={token} />
        }

        if (isList(token)) {
          return <DocsList key={key} ordinals={ordinals} token={token} />
        }

        switch (token.type) {
          case 'paragraph':
            return (
              <p className="my-4" key={key}>
                <DocsInline fallback={token.text} tokens={token.tokens} />
              </p>
            )
          case 'blockquote':
            return <DocsCallout key={key} tokens={token.tokens ?? []} />
          case 'hr':
            return <hr className="my-10 border-border-subtle" key={key} />
          case 'space':
          case 'html':
            return null
          default:
            return (
              <p className="my-4" key={key}>
                <DocsInline tokens={[token]} />
              </p>
            )
        }
      })}
    </div>
  )
}
