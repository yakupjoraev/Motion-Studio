import { z } from 'zod'

import { surfaceToken } from '../../scales'
import { heroCopyFields, heroFrameFields } from '../hero.schema'

export const SPLIT_RATIOS = ['even', 'text-wide', 'media-wide'] as const

export type SplitRatio = (typeof SPLIT_RATIOS)[number]

export const MEDIA_ASPECTS = ['auto', 'square', 'video', 'portrait'] as const

export type MediaAspect = (typeof MEDIA_ASPECTS)[number]

export const heroSplitSchema = z.object({
  ...heroCopyFields({
    eyebrow: 'Visual editing',
    headline: 'Every property, one panel, no guessing',
    subtitle:
      'Drop a block, tune it in the inspector, and read the source it will export before you commit to it.',
    actions: [
      { label: 'Open the studio', href: '#', variant: 'primary' },
      { label: 'Read the docs', href: '#', variant: 'secondary' },
    ],
  }),
  ...heroFrameFields({ align: 'start', minHeight: 'three-quarters' }),
  background: surfaceToken.default('transparent'),
  /** Media first. Responsive, because which half leads is a different answer on a phone. */
  reverse: z.boolean().default(false),
  ratio: z.enum(SPLIT_RATIOS).default('even'),
  mediaAspect: z.enum(MEDIA_ASPECTS).default('video'),
  /**
   * The plate the media sits on: hairline, radius, shadow. It is on by default because an image
   * dropped straight onto a page floats, and a frame is what makes it read as a screen.
   */
  mediaFrame: z.boolean().default(true),
})

export type HeroSplitProps = z.infer<typeof heroSplitSchema>
