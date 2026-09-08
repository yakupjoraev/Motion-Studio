import Image from 'next/image'

import { CARD, DRAGGED_BLOCK, STAGE } from './hero-stage'

import manifest from '../../../../public/thumbnails/thumbnails.json'

/** The card, drawn in canvas units so the server frame and the island place it identically. */
export const cardBox = (x: number, y: number) => ({
  left: `${(x / STAGE.width) * 100}%`,
  top: `${(y / STAGE.height) * 100}%`,
  width: `${(CARD.width / STAGE.width) * 100}%`,
  height: `${(CARD.height / STAGE.height) * 100}%`,
})

export const CARD_SURFACE =
  'absolute z-20 flex flex-col gap-1.5 rounded-lg border border-accent bg-surface-1/95 p-1.5 text-left outline-none [box-shadow:0_1px_0_0_color-mix(in_oklch,var(--ms-color-foreground)_16%,transparent)_inset,0_30px_70px_-30px_color-mix(in_oklch,var(--ms-color-accent)_80%,transparent)] focus-visible:shadow-focus'

/** The palette's own thumbnail for this block, so the card carries the picture the studio carries. */
const THUMBNAIL = (manifest as Record<string, { dark: { src: string; blurDataUrl: string } }>)[
  DRAGGED_BLOCK.id
]

export interface HeroCardFaceProps {
  readonly name: string
  readonly category: string
}

/**
 * The card's inside: the block's own catalogue thumbnail, its name, its category. The same three
 * things the studio's palette card carries, because the card on this page is that card.
 */
export function HeroCardFace({ name, category }: HeroCardFaceProps) {
  return (
    <>
      <span
        aria-hidden="true"
        className="relative block flex-1 overflow-hidden rounded-sm border border-border-subtle bg-surface-0"
      >
        {THUMBNAIL === undefined ? null : (
          <Image
            alt=""
            blurDataURL={THUMBNAIL.dark.blurDataUrl}
            className="h-full w-full object-cover"
            height={200}
            placeholder="blur"
            sizes="260px"
            src={THUMBNAIL.dark.src}
            width={320}
          />
        )}
      </span>
      <span className="flex items-baseline justify-between gap-2 px-0.5">
        <span className="truncate font-medium text-[13px] text-foreground">{name}</span>
        <span className="shrink-0 font-mono text-[10px] text-foreground-muted uppercase tracking-[0.14em]">
          {category}
        </span>
      </span>
    </>
  )
}
