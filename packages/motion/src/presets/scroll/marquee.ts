import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import {
  FLASH_SAFE_MIN_MS,
  durationControl,
  durationSchema,
  selectControl,
  switchControl,
} from '../shared'

const DIRECTIONS = ['left', 'right'] as const

/**
 * An infinite loop with no seam. The track holds the content **twice** and translates by exactly
 * -50 %: at the end of the cycle the second copy sits where the first began, so the jump back to 0 %
 * is invisible. Any other offset shows a gap or a stutter, which is what `marqueeTrack` states as
 * arithmetic and its test asserts.
 *
 * Content narrower than the container is repeated until the track is at least twice the container's
 * width — otherwise the "second copy" never reaches the viewport and the seam becomes a blank gap.
 */
export const marquee = definePreset({
  id: 'marquee',
  name: 'Marquee',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({
    duration: durationSchema(18000, FLASH_SAFE_MIN_MS, 60000),
    direction: z.enum(DIRECTIONS).default('left'),
    pauseOnHover: z.boolean().default(true),
  }),
  defaults: { duration: 18000, direction: 'left', pauseOnHover: true },
  controls: [
    durationControl('duration', 'Duration', FLASH_SAFE_MIN_MS, 60000),
    selectControl(
      'direction',
      'Direction',
      DIRECTIONS.map((value) => ({ value, label: value })),
    ),
    switchControl('pauseOnHover', 'Pause on hover'),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], requiresChildren: true, cost: 'moderate' },
  resolve: (params) => ({
    engine: 'css',
    className: params.pauseOnHover ? 'ms-marquee ms-marquee-pausable' : 'ms-marquee',
    properties: ['transform'],
    cssVars: {
      '--ms-marquee-duration': `${params.duration}ms`,
      '--ms-marquee-direction': params.direction === 'left' ? '-50%' : '50%',
    },
    transition: { duration: params.duration, repeat: 'infinite' },
    listeners: [{ event: 'scroll', variant: 'end' }],
    keyframes: `@keyframes ms-marquee { to { transform: translate3d(var(--ms-marquee-direction), 0, 0) } }
.ms-marquee { display: flex; width: max-content; animation: ms-marquee var(--ms-marquee-duration) linear infinite }
.ms-marquee-pausable:hover { animation-play-state: paused }`,
  }),
  /** § Reduced motion, scroll: the end state. A marquee standing still is its content, readable. */
  resolveReduced: () => ({
    engine: 'css',
    variants: { end: { x: 0 } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-marquee'],
    css: `@keyframes ms-marquee { to { transform: translateX(${params.direction === 'left' ? '-50%' : '50%'}) } }
.ms-marquee { display: flex; width: max-content; animation: ms-marquee ${params.duration}ms linear infinite }
${params.pauseOnHover ? '.ms-marquee:hover { animation-play-state: paused }' : ''}`,
  }),
})

/**
 * How many copies the track holds and how far it travels. Two copies and -50 % is the seamless pair;
 * narrow content is repeated first so the second copy is genuinely off screen when the cycle starts.
 */
export function marqueeTrack(args: {
  readonly contentWidth: number
  readonly containerWidth: number
}): { readonly copies: number; readonly translatePercent: number } {
  if (args.contentWidth <= 0) {
    return { copies: 2, translatePercent: -50 }
  }

  const perCopy = Math.max(1, Math.ceil(args.containerWidth / args.contentWidth))

  return { copies: perCopy * 2, translatePercent: -50 }
}
