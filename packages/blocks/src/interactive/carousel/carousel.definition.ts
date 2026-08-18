import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { HEADING_LEVELS } from '../../marketing/marketing.schema'
import {
  LABELLED_FRAME_CONTROLS,
  PANEL_ITEM_CONTROLS,
  panelItemTemplate,
} from '../interactive.controls'

import { carouselMotion } from './carousel.motion'
import {
  AUTOPLAY_INTERVAL_STEP,
  MAX_AUTOPLAY_INTERVAL,
  MAX_PER_VIEW,
  MAX_SLIDES,
  MIN_AUTOPLAY_INTERVAL,
  MIN_PER_VIEW,
  carouselSchema,
} from './carousel.schema'

export const carouselDefinition = defineBlock({
  id: blockId('carousel'),
  name: 'Carousel',
  description: 'A scroll-snap strip with real arrows, real dots, and safe autoplay.',
  category: 'interactive',
  tags: ['carousel', 'slider', 'slides', 'scroll-snap', 'gallery'],
  icon: 'layout-columns',

  propsSchema: carouselSchema,
  defaults: carouselSchema.parse({}),
  previewProps: carouselSchema.parse({ perView: 2 }),

  slots: [
    {
      name: 'slides',
      label: 'Slides',
      accepts: '*',
      minChildren: 0,
      maxChildren: MAX_SLIDES,
      orientation: () => 'horizontal',
    },
  ],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'slides',
          kind: 'list',
          label: 'Slides',
          hint: 'A slide’s text is shown until a block is dropped into it',
          options: {
            max: MAX_SLIDES,
            labelKey: 'label',
            sortable: true,
            itemTemplate: panelItemTemplate('Slide'),
            itemControls: PANEL_ITEM_CONTROLS,
          },
        },
      ],
    },
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'perView',
          kind: 'stepper',
          label: 'Slides in view',
          responsive: true,
          options: { min: MIN_PER_VIEW, max: MAX_PER_VIEW },
        },
        {
          path: 'headingLevel',
          kind: 'select',
          label: 'Heading level',
          hint: 'One step below the heading above the strip',
          options: {
            options: HEADING_LEVELS.map((level) => ({ value: level, label: `h${level}` })),
          },
        },
        ...LABELLED_FRAME_CONTROLS,
      ],
    },
    {
      id: 'controls',
      label: 'Controls',
      controls: [
        { path: 'arrows', kind: 'switch', label: 'Arrows' },
        { path: 'dots', kind: 'switch', label: 'Dots' },
        {
          path: 'autoplay',
          kind: 'switch',
          label: 'Autoplay',
          hint: 'Off under reduced motion, paused on hover and focus, and always with a pause button',
        },
        {
          path: 'autoplayInterval',
          kind: 'slider',
          label: 'Interval',
          options: {
            min: MIN_AUTOPLAY_INTERVAL,
            max: MAX_AUTOPLAY_INTERVAL,
            step: AUTOPLAY_INTERVAL_STEP,
            unit: 'ms',
          },
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    costClass: 'cheap',
  },

  defaultMotion: carouselMotion,

  codegen: {
    tag: 'section',
    /*
     * ADR-199's third case, and the only block in the catalogue that needs it: with no arrows, no dots and no
     * autoplay the export is a scroll-snap strip — markup and about twenty lines of CSS, no hook, no handler,
     * and therefore a Server Component.
     */
    client: {
      kind: 'whenAnyProp',
      props: ['arrows', 'dots', 'autoplay'],
      reason:
        'The controls read the scroll position and the timer advances it. Without all three the strip is CSS.',
    },
    notes: [
      'The scrolling is CSS scroll-snap: touch, trackpad, wheel and keyboard come from the browser rather than from a carousel library, and there is no dependency to install.',
    ],
  },

  a11y: {
    role: 'region',
    notes: [
      'A labelled region with aria-roledescription="carousel", and every slide a group with aria-roledescription="slide" and an aria-label that says its position — "3 of 7".',
      'Every control is a real button with a name that says what it does: "Previous slide", "Go to slide 3", "Pause slideshow". The arrows disable at the ends rather than doing nothing.',
      'Each slide is a focus stop, so a keyboard reader can scroll the strip; no slide is hidden from the accessibility tree, because a native scroller keeps them all in it.',
      'Autoplay is off by default, never starts under reduced motion, pauses on hover and on focus within, and renders its pause control from the same condition that starts the timer — WCAG 2.2.2.',
      'The current dot is a longer bar as well as a brighter colour, and carries aria-current.',
    ],
  },
})
