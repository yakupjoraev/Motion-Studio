import type { BlockDefinition } from '@motion-studio/schema'
import Link from 'next/link'

import { CardPreview } from './card-preview'
import { slotFill } from './slot-fill'

export interface GalleryCardProps {
  readonly definition: BlockDefinition
}

/**
 * A Server Component with one island in it. The name, the description and the tags are HTML the
 * server already knows; only the running block needs a browser.
 *
 * The link is on the heading and stretched over the card with `after:absolute`, rather than wrapped
 * around everything. A block is real markup with real anchors and real buttons in it, so a link
 * around the preview would be a link inside a link — invalid HTML, and a hydration error the browser
 * reports before a person notices the twenty extra tab stops.
 *
 * Those tab stops are the same problem said another way, which is why the preview is `inert`: a
 * catalogue card is a picture of a component, and a keyboard should reach the card, not the seven
 * controls inside the picture.
 *
 * `data-block-card` is what the search filters on — `hide-rule.tsx`.
 */
export function GalleryCard({ definition }: GalleryCardProps) {
  return (
    <article
      className="group relative flex h-full flex-col gap-3 rounded-xl border border-border bg-surface-1 p-3 transition-colors focus-within:border-border-strong hover:border-border-strong"
      data-block-card={definition.id}
    >
      <div aria-hidden="true" inert>
        <CardPreview
          category={definition.category}
          id={definition.id}
          props={definition.previewProps as Record<string, unknown>}
        >
          {slotFill(definition)}
        </CardPreview>
      </div>

      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <h3 className="font-medium text-sm tracking-tight">
          <Link
            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:shadow-focus"
            href={`/blocks/${definition.id}`}
            prefetch={false}
          >
            {definition.name}
          </Link>
        </h3>

        <p className="text-foreground-muted text-xs leading-snug">{definition.description}</p>

        <ul className="flex flex-wrap gap-1.5 pt-1">
          {definition.tags.slice(0, 3).map((tag) => (
            <li
              className="rounded-full border border-border-subtle px-2 py-0.5 font-mono text-2xs text-foreground-muted uppercase tracking-[0.12em]"
              key={tag}
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
