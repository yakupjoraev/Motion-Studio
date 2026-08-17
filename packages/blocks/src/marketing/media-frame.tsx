import { cn } from '@motion-studio/utils'

import { CARD_MEDIA, CARD_RADIUS, cardStyles } from './card.styles'
import type { Media } from './marketing.schema'
import { innerRadiusClass } from './nested-radius'

export interface MediaFrameProps {
  readonly media: Media
  readonly aspect?: 'video' | 'square' | 'portrait'
  readonly priority?: boolean
  readonly testId?: string
}

const ASPECT_CLASS = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[4/5]',
} as const

/**
 * A picture on a plate: the frame is a card at `CARD_RADIUS` holding the image 8 px inside it, so the
 * image's corner is `innerRadius(16, 8)` — the nested-radius rule from DESIGN_SYSTEM.md § Radius, spent
 * through the helper rather than guessed. Concentric corners that are not concentric are the specific
 * defect that reads as amateur, and it is invisible until you look for it.
 *
 * With no `src` it draws the plate at the chosen ratio rather than collapsing, so dropping the block and
 * then choosing a file does not move the page under the pointer.
 */
export function MediaFrame({
  media,
  aspect = 'video',
  priority = false,
  testId = 'media-frame',
}: MediaFrameProps) {
  return (
    <div className={cn(cardStyles({ treatment: 'card' }), 'p-2')} data-testid={testId}>
      <div className={cn(CARD_MEDIA, ASPECT_CLASS[aspect], 'bg-surface-2')}>
        {media.src === '' ? (
          <span
            className="flex size-full items-center justify-center text-foreground-subtle text-base"
            data-testid="media-empty"
          >
            No image yet
          </span>
        ) : (
          <img
            alt={media.alt}
            className={cn('size-full object-cover', innerRadiusClass(CARD_RADIUS, 8))}
            data-testid="media-image"
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            height={media.height}
            loading={priority ? 'eager' : 'lazy'}
            sizes={media.sizes}
            src={media.src}
            width={media.width}
          />
        )}
      </div>
    </div>
  )
}
