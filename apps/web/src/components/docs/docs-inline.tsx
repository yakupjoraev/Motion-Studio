import type { Token } from 'marked'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { resolveLink } from '../../lib/docs/cross-references'

const CODE_CLASS =
  'rounded-[3px] border border-border-subtle bg-surface-2 px-1 py-px font-mono text-[0.9em]'

function InlineLink({
  target,
  children,
}: { readonly target: string; readonly children: ReactNode }) {
  const resolved = resolveLink(target)
  const className =
    'rounded-sm text-accent underline decoration-accent/40 underline-offset-2 outline-none transition-colors hover:decoration-accent focus-visible:shadow-focus'

  if (resolved.kind === 'external') {
    return (
      <a className={className} href={resolved.href} rel="noreferrer" target="_blank">
        {children}
      </a>
    )
  }

  if (resolved.kind === 'doc') {
    return (
      <Link className={className} href={resolved.href} prefetch={false}>
        {children}
      </Link>
    )
  }

  // A relative target that is not a document would be a link to a 404; the path itself is the useful
  // thing to show. `links.test.ts` asserts the corpus has none.
  return <code className={CODE_CLASS}>{target}</code>
}

export interface DocsInlineProps {
  readonly tokens: readonly Token[] | undefined
  readonly fallback?: string
}

/** The five inline constructs the corpus uses, plus the two escapes marked emits for them. */
export function DocsInline({ tokens, fallback }: DocsInlineProps) {
  if (tokens === undefined || tokens.length === 0) {
    return fallback ?? null
  }

  return (
    <>
      {tokens.map((token, index) => {
        const key = `${token.type}-${index}`

        switch (token.type) {
          case 'text':
          case 'escape':
            return 'tokens' in token && token.tokens !== undefined ? (
              <DocsInline key={key} tokens={token.tokens} />
            ) : (
              token.text
            )
          case 'codespan':
            return (
              <code className={CODE_CLASS} key={key}>
                {token.text}
              </code>
            )
          case 'strong':
            return (
              <strong className="font-semibold text-foreground" key={key}>
                <DocsInline fallback={token.text} tokens={token.tokens} />
              </strong>
            )
          case 'em':
            return (
              <em key={key}>
                <DocsInline fallback={token.text} tokens={token.tokens} />
              </em>
            )
          case 'del':
            return (
              <s key={key}>
                <DocsInline fallback={token.text} tokens={token.tokens} />
              </s>
            )
          case 'br':
            return <br key={key} />
          case 'link':
            return (
              <InlineLink key={key} target={token.href}>
                <DocsInline fallback={token.text} tokens={token.tokens} />
              </InlineLink>
            )
          default:
            return token.raw
        }
      })}
    </>
  )
}
