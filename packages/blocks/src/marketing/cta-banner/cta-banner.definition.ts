import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { ALIGNMENTS, optionsFrom } from '../../scales'
import {
  ACTION_VARIANTS,
  DESCRIPTION_MAX_LENGTH,
  EYEBROW_MAX_LENGTH,
  HEADING_LEVELS,
  HEADING_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  MAX_ACTIONS,
} from '../marketing.schema'

import { ctaBannerMotion } from './cta-banner.motion'
import { CTA_SURFACES, ctaBannerSchema } from './cta-banner.schema'

export const ctaBannerDefinition = defineBlock({
  id: blockId('cta-banner'),
  name: 'CTA banner',
  description: 'A full-width band with a headline, a sentence and up to two buttons.',
  category: 'marketing',
  tags: ['marketing', 'cta', 'banner', 'gradient', 'glass'],
  icon: 'zap',

  propsSchema: ctaBannerSchema,
  defaults: ctaBannerSchema.parse({}),
  previewProps: ctaBannerSchema.parse({
    heading: 'Build the page, keep the code',
    description: '',
  }),

  slots: [],

  controls: [
    {
      id: 'content',
      label: 'Content',
      controls: [
        {
          path: 'eyebrow',
          kind: 'text',
          label: 'Eyebrow',
          options: { maxLength: EYEBROW_MAX_LENGTH },
        },
        {
          path: 'heading',
          kind: 'textarea',
          label: 'Heading',
          options: { maxLength: HEADING_MAX_LENGTH, rows: 2 },
        },
        {
          path: 'description',
          kind: 'textarea',
          label: 'Description',
          options: { maxLength: DESCRIPTION_MAX_LENGTH, rows: 3 },
        },
        {
          path: 'actions',
          kind: 'list',
          label: 'Buttons',
          options: {
            max: MAX_ACTIONS,
            labelKey: 'label',
            sortable: true,
            itemTemplate: { label: 'Read the docs', href: '#', variant: 'secondary' },
            itemControls: [
              {
                path: 'label',
                kind: 'text',
                label: 'Label',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              { path: 'href', kind: 'link', label: 'Link' },
              {
                path: 'variant',
                kind: 'segmented',
                label: 'Variant',
                options: { options: optionsFrom(ACTION_VARIANTS) },
              },
            ],
          },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'surface',
          kind: 'segmented',
          label: 'Surface',
          hint: 'Glass needs a background behind it',
          options: { options: optionsFrom(CTA_SURFACES) },
        },
        {
          path: 'align',
          kind: 'segmented',
          label: 'Align',
          responsive: true,
          options: { options: optionsFrom(ALIGNMENTS) },
        },
        {
          path: 'headingLevel',
          kind: 'select',
          label: 'Heading level',
          options: {
            options: HEADING_LEVELS.map((level) => ({ value: level, label: `h${level}` })),
          },
        },
        { path: 'hidden', kind: 'switch', label: 'Hidden', responsive: true },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: true,
    requiresBackdrop: true,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: ctaBannerMotion,

  codegen: { tag: 'section' },

  a11y: {
    notes: [
      'On an accent band the text and both buttons invert to foreground-onAccent, which the token contract already proves against every step of the accent ramp in both colour modes.',
      'A button with a link is an <a> and one without is a <button>, so Enter and Space do what the element promises.',
      'The heading level is a prop, so a band under an h2 section takes h3 and the page outline stays continuous.',
    ],
  },
})
