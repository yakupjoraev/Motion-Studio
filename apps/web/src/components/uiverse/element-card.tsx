import type { UiverseElement } from '@motion-studio/uiverse'
import Link from 'next/link'

import { getRequestDictionary } from '../../lib/i18n/request-locale'

import { ElementPreview } from './element-preview'

export interface ElementCardProps {
  readonly element: UiverseElement
  /** `null` when the count has not been collected, which is not the same as zero. */
  readonly views: number | null
}

const NUMBER = new Intl.NumberFormat('en-US')

/**
 * One element: its preview, who wrote it, and how often the site has served it.
 *
 * The preview is `inert` and `aria-hidden` for the reason the block gallery's is — a card is a
 * picture of a component, and a keyboard should reach the card rather than the button inside the
 * picture. Here it matters more: some of these elements are whole forms.
 */
export function ElementCard({ element, views }: ElementCardProps) {
  const { uiverse } = getRequestDictionary()

  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-xl border border-border bg-surface-1 p-3 transition-colors focus-within:border-border-strong hover:border-border-strong">
      <div
        aria-hidden="true"
        className="grid h-44 place-items-center overflow-hidden rounded-lg bg-surface-2"
        inert
      >
        <ElementPreview css={element.css} html={element.html} styling={element.styling} />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="m-0 font-medium text-foreground text-sm">
          {/* Stretched over the card with `after:absolute` rather than wrapped around it: the preview
              is markup with its own anchors and buttons, and a link around that is a link inside a
              link — the gallery's cards carry the same idiom for the same reason. */}
          <Link
            className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:shadow-focus"
            href={`/uiverse/${element.id}`}
          >
            {element.slug}
          </Link>
        </h3>

        <p className="m-0 text-foreground-muted text-xs">
          {uiverse.byAuthor.replace('{author}', element.author)}
        </p>

        {element.origin === undefined ? null : (
          <p className="m-0 text-foreground-subtle text-xs">
            {uiverse.republishedFrom.replace('{origin}', element.origin)}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 font-mono text-2xs text-foreground-muted">
        <span className="rounded-sm bg-surface-2 px-1.5 py-0.5">
          {element.styling === 'tailwind' ? uiverse.tailwind : uiverse.css}
        </span>
        <span className="tabular-nums">
          {views === null
            ? uiverse.viewsUnknown
            : uiverse.views.replace('{count}', NUMBER.format(views))}
        </span>
      </div>
    </article>
  )
}
