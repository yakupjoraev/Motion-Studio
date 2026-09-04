import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { sliderControl } from '../shared'

import { ON_SCROLL } from './progress'

/**
 * Cards that pin and scale as the next one arrives.
 *
 * **`position: sticky` plus a scale driven by the shared scroll bus, engine `css`.** Prompt 32 asked
 * whether a pinned stack needs a timeline library, and the answer was that this one is entirely
 * inside native sticky semantics: a second engine on the element would buy behaviour the platform
 * already provides. ADR-349 later removed the alternative altogether.
 */
export const stickyStack = definePreset({
  id: 'sticky-stack',
  name: 'Sticky stack',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({
    offset: z.number().min(0).max(200).default(24),
    scaleStep: z.number().min(0).max(0.2).default(0.04),
  }),
  defaults: { offset: 24, scaleStep: 0.04 },
  controls: [
    sliderControl('offset', 'Offset', 0, 200, { unit: 'px' }),
    sliderControl('scaleStep', 'Scale step', 0, 0.2, { step: 0.01 }),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], requiresChildren: true, cost: 'moderate' },
  resolve: (params) => ({
    engine: 'css',
    className: 'ms-sticky-stack',
    properties: ['transform'],
    cssVars: {
      '--ms-sticky-offset': `${params.offset}px`,
      '--ms-sticky-step': String(params.scaleStep),
      '--ms-scroll-progress': '0',
    },
    transition: { duration: 0 },
    listeners: ON_SCROLL,
    keyframes:
      '.ms-sticky-stack > * { position: sticky; top: var(--ms-sticky-offset); transform: scale(calc(1 - var(--ms-sticky-step) * var(--ms-sticky-index, 0))) }',
  }),
  /** Pinned, unscaled, still readable: the stack without the choreography. */
  resolveReduced: () => ({
    engine: 'css',
    variants: { end: { scale: 1 } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [],
    classNames: ['ms-sticky-stack'],
    css: `.ms-sticky-stack > * { position: sticky; top: ${params.offset}px }`,
  }),
})
