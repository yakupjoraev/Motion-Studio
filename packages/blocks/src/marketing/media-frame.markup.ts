import { type MarkupElement, el, literal, txt } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

import { CARD_MEDIA, CARD_RADIUS, cardStyles } from './card.styles'
import type { Media } from './marketing.schema'
import { innerRadiusClass } from './nested-radius'

export interface MediaFrameMarkupInput {
  readonly media: Media
  readonly aspect?: 'video' | 'square' | 'portrait'
  readonly priority?: boolean
}

const ASPECT_CLASS = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[4/5]',
} as const

/**
 * `MediaFrame` as markup. The nested-radius arithmetic runs here as well rather than being copied as a
 * literal class — a corner that stops being concentric when the token changes is the defect the helper
 * exists to prevent, on the canvas and in the exported page alike.
 */
export function mediaFrameMarkup({
  media,
  aspect = 'video',
  priority = false,
}: MediaFrameMarkupInput): MarkupElement {
  const inner =
    media.src === ''
      ? el('span', {
          classNames: [
            'flex size-full items-center justify-center text-foreground-subtle text-base',
          ],
          children: [txt('No image yet')],
        })
      : el('img', {
          classNames: ['size-full object-cover', innerRadiusClass(CARD_RADIUS, 8)],
          attributes: {
            alt: literal(media.alt),
            decoding: literal('async'),
            fetchPriority: literal(priority ? 'high' : 'auto'),
            height: literal(media.height),
            loading: literal(priority ? 'eager' : 'lazy'),
            sizes: literal(media.sizes),
            src: literal(media.src),
            width: literal(media.width),
          },
        })

  return el('div', {
    classNames: [cn(cardStyles({ treatment: 'card' }), 'p-2')],
    children: [
      el('div', {
        classNames: [cn(CARD_MEDIA, ASPECT_CLASS[aspect], 'bg-surface-2')],
        children: [inner],
      }),
    ],
  })
}
