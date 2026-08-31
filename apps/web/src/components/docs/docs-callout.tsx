import { InfoIcon } from '@motion-studio/icons'
import type { Token } from 'marked'

import { DocsInline } from './docs-inline'

/**
 * A blockquote in the specification is an aside that the reader must not skip — the contract opens
 * with one. It carries a role and an icon rather than a colour, so it survives forced colours and
 * announces itself as a note.
 */
export function DocsCallout({ tokens }: { readonly tokens: readonly Token[] }) {
  return (
    <aside
      aria-label="Note"
      className="my-6 flex gap-3 rounded-lg border border-accent/30 bg-accent-muted/25 px-4 py-3"
    >
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-accent" />

      <div className="flex flex-col gap-2 text-foreground-muted text-sm leading-relaxed">
        {tokens.map((token, index) =>
          token.type === 'paragraph' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: a quote's paragraphs are identified by their position
            <p key={index}>
              <DocsInline fallback={token.text} tokens={token.tokens} />
            </p>
          ) : null,
        )}
      </div>
    </aside>
  )
}
