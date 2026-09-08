import Image from 'next/image'

import { getRequestDictionary } from '../../../lib/i18n/request-locale'

import { STAGE } from './hero-stage'
import { HERO_THUMBNAIL } from './hero-thumbnail'
import { HeroWindow } from './hero-window'

/**
 * The frame before the island arrives, the whole of it when JavaScript never does, and what a phone
 * gets on purpose.
 *
 * Same window, same aspect ratio, so the swap on a laptop moves nothing — ADR-295 measured the
 * alternative at 0.073 CLS. What fills it is the block's own catalogue thumbnail, which is the one
 * honest thing to show where the live page cannot go: a 1280 px layout on a 390 px screen is a
 * picture of a page whatever it is made of, so it may as well be the picture the catalogue already
 * generated from the real component.
 */
export function HeroPageStatic() {
  const { hero } = getRequestDictionary().landing

  return (
    <figure className="m-0 flex flex-col gap-3">
      <HeroWindow>
        <div
          className="relative w-full overflow-hidden bg-surface-0"
          style={{ aspectRatio: `${STAGE.width} / ${STAGE.height}` }}
        >
          <Image
            alt=""
            className="h-full w-full object-cover"
            height={HERO_THUMBNAIL.height}
            priority
            sizes="(min-width: 64rem) 46rem, 100vw"
            src={HERO_THUMBNAIL.src}
            width={HERO_THUMBNAIL.width}
          />
          <span className="absolute top-0 left-0 rounded-br-md bg-surface-2 px-2.5 py-1 font-mono text-2xs text-foreground-muted uppercase tracking-[0.16em]">
            {hero.demoBlock}
          </span>
        </div>
      </HeroWindow>

      <figcaption className="min-h-[2.6em] font-mono text-2xs text-foreground-muted uppercase leading-[1.3] tracking-[0.14em]">
        {hero.demoStaticCaption}
      </figcaption>
    </figure>
  )
}
