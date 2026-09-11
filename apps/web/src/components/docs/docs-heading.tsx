import type { Tokens } from 'marked'

import { plainText } from '../../lib/docs/frontmatter'
import type { DocHeading } from '../../lib/docs/headings'

import { DocsInline } from './docs-inline'

/**
 * Colour and weight are stated here rather than inherited from the article, which paints its body in
 * `foreground-muted`. Inheriting left every heading at the body's colour and weight, so a bold phrase
 * inside a paragraph outranked the heading above it — measured on `/docs/architecture`: heading
 * 7.70 : 1 at weight 400 against `strong` 19.75 : 1 at weight 600 (ADR-394).
 */
const LEVEL_CLASS: Readonly<Record<number, string>> = {
  1: 'mt-0 mb-4 font-display font-semibold text-3xl text-foreground leading-[1.1] tracking-[-0.03em] sm:text-4xl',
  2: 'mt-12 mb-3 font-display font-semibold text-xl text-foreground tracking-[-0.02em] sm:text-2xl',
  3: 'mt-8 mb-2 font-medium text-base text-foreground sm:text-lg',
  4: 'mt-6 mb-2 font-mono text-2xs uppercase tracking-[0.14em] text-foreground-muted',
}

export interface DocsHeadingProps {
  readonly token: Tokens.Heading
  readonly heading: DocHeading
}

/**
 * Every heading owns an anchor, and the anchor is a real link so it is keyboard-reachable and can be
 * copied. It is named "Link to <heading>" rather than "#", which is what a screen reader would read
 * out otherwise, twenty times a page.
 */
export function DocsHeading({ token, heading }: DocsHeadingProps) {
  const Tag = `h${Math.min(token.depth, 6)}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return (
    <Tag
      className={`group scroll-mt-24 ${LEVEL_CLASS[token.depth] ?? LEVEL_CLASS[4]}`}
      id={heading.slug}
    >
      <DocsInline fallback={token.text} tokens={token.tokens} />{' '}
      <a
        aria-label={`Link to ${plainText(heading.text)}`}
        className="ms-1 rounded-sm font-mono text-accent text-sm no-underline opacity-0 outline-none transition-opacity focus-visible:opacity-100 focus-visible:shadow-focus group-hover:opacity-100"
        href={`#${heading.slug}`}
      >
        #
      </a>
    </Tag>
  )
}
