import Image from 'next/image'

import { CARD, STAGE } from './hero-stage'
import { HERO_THUMBNAIL } from './hero-thumbnail'

/** The card, drawn in canvas units so the server frame and the island place it identically. */
export const cardBox = (x: number, y: number) => ({
  left: `${(x / STAGE.width) * 100}%`,
  top: `${(y / STAGE.height) * 100}%`,
  width: `${(CARD.width / STAGE.width) * 100}%`,
  height: `${(CARD.height / STAGE.height) * 100}%`,
})

export const CARD_SURFACE =
  'absolute z-20 flex flex-col gap-1.5 rounded-lg border border-accent bg-surface-1/95 p-1.5 text-left outline-none [box-shadow:0_1px_0_0_color-mix(in_oklch,var(--ms-color-foreground)_16%,transparent)_inset,0_30px_70px_-30px_color-mix(in_oklch,var(--ms-color-accent)_80%,transparent)] focus-visible:shadow-focus'

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
        <Image
          alt=""
          className="h-full w-full object-cover"
          // The card is dragged by pointer events; a browser dragging the image out of it instead
          // ends that gesture — measured in WebKit, `dragstart` after two `pointermove`s.
          draggable={false}
          height={HERO_THUMBNAIL.height}
          sizes="260px"
          src={HERO_THUMBNAIL.src}
          width={HERO_THUMBNAIL.width}
        />
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
