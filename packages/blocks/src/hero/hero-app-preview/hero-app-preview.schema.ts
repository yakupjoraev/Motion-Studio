import { z } from 'zod'

import { surfaceToken } from '../../scales'
import { heroCopyFields, heroFrameFields } from '../hero.schema'

export const TILT_LIMIT = 20
export const PERSPECTIVE_MIN = 400
export const PERSPECTIVE_MAX = 2400

export const IMAGE_URL_MAX_LENGTH = 2048
export const ALT_MAX_LENGTH = 160

/** The `image` control's own shape — `packages/ui/src/controls/image-field`. One control, one value. */
export const imageSchema = z.object({
  src: z.string().max(IMAGE_URL_MAX_LENGTH).default(''),
  alt: z.string().max(ALT_MAX_LENGTH).default(''),
})

export type HeroImage = z.infer<typeof imageSchema>

export const heroAppPreviewSchema = z.object({
  ...heroCopyFields({
    eyebrow: 'The studio',
    headline: 'The editor is the product, not a demo of one',
    subtitle:
      'Canvas, inspector, layers and export in one window — the same window this page was built in.',
    actions: [
      { label: 'Open the studio', href: '#', variant: 'primary' },
      { label: 'See the gallery', href: '#', variant: 'secondary' },
    ],
  }),
  ...heroFrameFields({ align: 'start', minHeight: 'three-quarters' }),
  background: surfaceToken.default('transparent'),
  image: imageSchema.default({ src: '', alt: '' }),
  /**
   * Explicit dimensions, always. They are what reserve the box before the file arrives — PERFORMANCE
   * .md § Images — and CLS is a budget in CI rather than an aspiration.
   */
  imageWidth: z.number().int().min(1).max(8192).default(1440),
  imageHeight: z.number().int().min(1).max(8192).default(900),
  tiltX: z.number().min(-TILT_LIMIT).max(TILT_LIMIT).default(8),
  tiltY: z.number().min(-TILT_LIMIT).max(TILT_LIMIT).default(-12),
  perspective: z.number().int().min(PERSPECTIVE_MIN).max(PERSPECTIVE_MAX).default(1400),
  glow: z.boolean().default(true),
})

export type HeroAppPreviewProps = z.infer<typeof heroAppPreviewSchema>
