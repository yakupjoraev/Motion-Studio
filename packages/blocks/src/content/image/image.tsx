import {
  IMAGE_CAPTION,
  IMAGE_EMPTY,
  imageFigureStyles,
  imageFrameStyles,
  imageStyles,
} from './image.styles'
import type { ImageProps } from './image.types'

/**
 * An image, framed and optionally captioned.
 *
 * It is an `<img>` rather than `next/image` — ADR-119: the registry takes no framework dependency
 * because two of the three hosts a block renders in have no Next runtime, and the codegen descriptor
 * is where the export decides which element to emit. Everything rule 10 was protecting is here:
 * explicit `width`/`height` reserve the box, `sizes` is a real value, and `priority` maps to
 * `fetchPriority` plus eager loading rather than being a word with no effect.
 *
 * With no `src` it draws a plate at the chosen ratio. A block that collapsed to nothing when dropped
 * would make the canvas jump the moment a file arrived.
 */
export function Image({
  src,
  alt,
  width,
  height,
  sizes,
  aspect,
  fit,
  radius,
  caption,
  priority,
  hidden,
}: ImageProps) {
  return (
    <figure className={imageFigureStyles({ hidden })}>
      <div className={imageFrameStyles({ aspect, radius })}>
        {src === '' ? (
          <span className={IMAGE_EMPTY} data-testid="image-empty">
            No image yet
          </span>
        ) : (
          <img
            alt={alt}
            className={imageStyles({ fit, aspect })}
            data-testid="image-element"
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            sizes={sizes}
            src={src}
            width={width}
          />
        )}
      </div>

      {caption !== '' && <figcaption className={IMAGE_CAPTION}>{caption}</figcaption>}
    </figure>
  )
}
