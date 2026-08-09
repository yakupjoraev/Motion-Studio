import type { CSSProperties } from 'react'

import type { HeroImage } from './hero-app-preview.schema'
import {
  HERO_PREVIEW_FRAME,
  HERO_PREVIEW_IMAGE,
  HERO_PREVIEW_TILT,
} from './hero-app-preview.styles'
import { PreviewWindow } from './preview-window'

export interface PreviewPlateProps {
  readonly image: HeroImage
  readonly width: number
  readonly height: number
  readonly tiltX: number
  readonly tiltY: number
  readonly perspective: number
}

/**
 * The tilted plate: the rotation, the frame, and whichever of the two contents applies.
 *
 * The three tilt values arrive as CSS variables on a `style` attribute, which § Rules 3 allows for a
 * genuinely dynamic value carried by a variable — a rotation the user dials is exactly that, and
 * ADR-116's alternative, a scale, would throw away the control the design asks for.
 *
 * The image is `eager` and high priority because ADR-120 measured that it, not the headline, is the
 * largest contentful paint here — so the honest thing is to request it early rather than to pretend.
 */
export function PreviewPlate({
  image,
  width,
  height,
  tiltX,
  tiltY,
  perspective,
}: PreviewPlateProps) {
  const tilt = {
    '--ms-tilt-x': `${tiltX}deg`,
    '--ms-tilt-y': `${tiltY}deg`,
    '--ms-tilt-perspective': `${perspective}px`,
  } as CSSProperties

  return (
    <div className={HERO_PREVIEW_TILT} data-testid="hero-preview-tilt" style={tilt}>
      <div className={HERO_PREVIEW_FRAME}>
        {image.src === '' ? (
          <PreviewWindow />
        ) : (
          <img
            alt={image.alt}
            className={HERO_PREVIEW_IMAGE}
            data-testid="hero-preview-image"
            decoding="async"
            fetchPriority="high"
            height={height}
            loading="eager"
            sizes="(max-width: 1024px) 100vw, 50vw"
            src={image.src}
            width={width}
          />
        )}
      </div>
    </div>
  )
}
