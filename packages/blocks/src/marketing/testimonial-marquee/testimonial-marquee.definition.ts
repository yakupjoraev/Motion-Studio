import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { SECTION_FRAME_CONTROLS, sectionCopyGroup } from '../marketing.controls'
import {
  MARQUEE_MAX_DURATION,
  MARQUEE_MIN_DURATION,
  TESTIMONIAL_ATTRIBUTION_MAX_LENGTH,
  TESTIMONIAL_QUOTE_MAX_LENGTH,
} from '../marketing.schema'

import { testimonialMarqueeMotion } from './testimonial-marquee.motion'
import {
  MAX_MARQUEE_ITEMS,
  MAX_MARQUEE_ROWS,
  testimonialMarqueeSchema,
} from './testimonial-marquee.schema'

export const testimonialMarqueeDefinition = defineBlock({
  id: blockId('testimonial-marquee'),
  name: 'Testimonial marquee',
  description: 'Rows of testimonials scrolling in alternating directions, pausing on hover.',
  category: 'marketing',
  tags: ['marketing', 'testimonial', 'marquee', 'social proof', 'scrolling'],
  icon: 'wave',

  propsSchema: testimonialMarqueeSchema,
  defaults: testimonialMarqueeSchema.parse({}),
  previewProps: testimonialMarqueeSchema.parse({
    eyebrow: '',
    heading: '',
    rows: 2,
    items: testimonialMarqueeSchema.parse({}).items.slice(0, 4),
  }),

  slots: [],

  controls: [
    sectionCopyGroup(),
    {
      id: 'motion',
      label: 'Marquee',
      controls: [
        {
          path: 'rows',
          kind: 'stepper',
          label: 'Rows',
          options: { min: 1, max: MAX_MARQUEE_ROWS },
        },
        {
          path: 'duration',
          kind: 'slider',
          label: 'Cycle',
          hint: 'One full loop. Each row runs slightly slower than the one above it',
          options: { min: MARQUEE_MIN_DURATION, max: MARQUEE_MAX_DURATION, step: 1000, unit: 'ms' },
        },
        { path: 'pauseOnHover', kind: 'switch', label: 'Pause on hover' },
        {
          path: 'fadeEdges',
          kind: 'switch',
          label: 'Fade the edges',
          hint: 'Turn it off on a coloured band — the mask fades to transparent, not to the band',
        },
        ...SECTION_FRAME_CONTROLS,
      ],
    },
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'items',
          kind: 'list',
          label: 'Testimonials',
          hint: 'Dealt round-robin across the rows, so reordering one moves one',
          options: {
            max: MAX_MARQUEE_ITEMS,
            labelKey: 'author',
            sortable: true,
            itemTemplate: {
              quote: 'Short enough to read while it moves.',
              author: 'Name',
              role: 'Role',
              company: 'Company',
              avatar: '',
            },
            itemControls: [
              {
                path: 'quote',
                kind: 'textarea',
                label: 'Quote',
                options: { maxLength: TESTIMONIAL_QUOTE_MAX_LENGTH, rows: 3 },
              },
              {
                path: 'author',
                kind: 'text',
                label: 'Name',
                options: { maxLength: TESTIMONIAL_ATTRIBUTION_MAX_LENGTH },
              },
              {
                path: 'role',
                kind: 'text',
                label: 'Role',
                options: { maxLength: TESTIMONIAL_ATTRIBUTION_MAX_LENGTH },
              },
              {
                path: 'company',
                kind: 'text',
                label: 'Company',
                options: { maxLength: TESTIMONIAL_ATTRIBUTION_MAX_LENGTH },
              },
              { path: 'avatar', kind: 'image', label: 'Photo' },
            ],
          },
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'moderate',
  },

  defaultMotion: testimonialMarqueeMotion,

  codegen: { tag: 'section' },

  a11y: {
    notes: [
      'The second copy of each row is aria-hidden: it exists to hide the seam, and a screen reader reading every testimonial twice is the defect that hides behind a seamless loop.',
      'The rows pause on hover, so a reader can stop a quote to finish it.',
      'Under reduced motion the tracks stop and become a wrapping, centred grid — every testimonial readable, nothing moving.',
      'A track wider than the page scrolls inside its own row, so the page never scrolls sideways.',
    ],
  },
})
