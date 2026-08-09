import { z } from 'zod'

import { heroCopyFields, heroFrameFields } from '../hero.schema'

/** How much of the surface token sits between the footage and the text. */
export const VIDEO_SCRIMS = ['soft', 'medium', 'strong'] as const

export type VideoScrim = (typeof VIDEO_SCRIMS)[number]

export const URL_MAX_LENGTH = 2048

export const heroVideoSchema = z.object({
  ...heroCopyFields({
    eyebrow: 'See it work',
    headline: 'Ninety seconds from empty canvas to shipped page',
    subtitle: 'No slides. The whole flow, in one take.',
    actions: [
      { label: 'Open the studio', href: '#', variant: 'primary' },
      { label: 'Read the docs', href: '#', variant: 'ghost' },
    ],
  }),
  ...heroFrameFields({ align: 'center', minHeight: 'three-quarters' }),
  src: z.string().max(URL_MAX_LENGTH).default(''),
  /**
   * The poster is not a fallback. It is what the block shows before playback, under reduced motion,
   * and in every export target that does not run JavaScript — so it has to carry the design on its
   * own rather than being a frame grabbed from the middle of the footage.
   */
  poster: z.string().max(URL_MAX_LENGTH).default(''),
  captions: z.string().max(URL_MAX_LENGTH).default(''),
  /**
   * The footage says nothing the copy does not. A video that *is* saying something needs a captions
   * track instead — `heroVideoNeedsCaptions` is the predicate the export report reads.
   */
  decorative: z.boolean().default(true),
  scrim: z.enum(VIDEO_SCRIMS).default('strong'),
})

export type HeroVideoProps = z.infer<typeof heroVideoSchema>

/**
 * ACCESSIBILITY.md § Media: footage that carries information needs a captions track, and footage that
 * carries none has to say so. A block cannot refuse to render half-configured — the user is mid-edit —
 * so the rule is a predicate the export report can act on rather than a schema refusal.
 */
export const heroVideoNeedsCaptions = (props: {
  readonly src: string
  readonly captions: string
  readonly decorative: boolean
}): boolean => props.src !== '' && props.captions === '' && !props.decorative
