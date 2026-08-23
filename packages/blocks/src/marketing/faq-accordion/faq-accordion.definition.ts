import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { SECTION_FRAME_CONTROLS, sectionCopyGroup } from '../marketing.controls'
import { TITLE_MAX_LENGTH } from '../marketing.schema'

import { faqAccordionMotion } from './faq-accordion.motion'
import {
  FAQ_ANSWER_MAX_LENGTH,
  FAQ_MODES,
  MAX_FAQ_ITEMS,
  faqAccordionSchema,
} from './faq-accordion.schema'

export const faqAccordionDefinition = defineBlock({
  id: blockId('faq-accordion'),
  name: 'FAQ accordion',
  description: 'Questions and answers on a Radix Accordion, with optional FAQPage structured data.',
  category: 'marketing',
  tags: ['marketing', 'faq', 'accordion', 'questions', 'seo'],
  icon: 'list',

  propsSchema: faqAccordionSchema,
  defaults: faqAccordionSchema.parse({}),
  previewProps: faqAccordionSchema.parse({
    heading: '',
    items: faqAccordionSchema.parse({}).items.slice(0, 3),
  }),

  slots: [],

  controls: [
    sectionCopyGroup(),
    {
      id: 'behaviour',
      label: 'Behaviour',
      controls: [
        {
          path: 'mode',
          kind: 'segmented',
          label: 'Open',
          hint: 'One at a time, or as many as the reader likes',
          options: { options: optionsFrom(FAQ_MODES) },
        },
        {
          path: 'defaultOpen',
          kind: 'stepper',
          label: 'Starts open',
          hint: '−1 starts them all closed',
          options: { min: -1, max: MAX_FAQ_ITEMS - 1 },
        },
        {
          path: 'jsonLd',
          kind: 'switch',
          label: 'FAQPage structured data',
          hint: 'Emitted by the export only. Structured data that does not match the page is a penalty',
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
          label: 'Questions',
          options: {
            max: MAX_FAQ_ITEMS,
            labelKey: 'question',
            sortable: true,
            itemTemplate: {
              question: 'A question a reader actually has',
              answer: 'The answer, in two sentences at most.',
            },
            itemControls: [
              {
                path: 'question',
                kind: 'text',
                label: 'Question',
                options: { maxLength: TITLE_MAX_LENGTH },
              },
              {
                path: 'answer',
                kind: 'textarea',
                label: 'Answer',
                options: { maxLength: FAQ_ANSWER_MAX_LENGTH, rows: 4 },
              },
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
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: faqAccordionMotion,

  codegen: {
    tag: 'section',
    dependencies: { '@radix-ui/react-accordion': '^1.2.20' },
    imports: [{ from: '@radix-ui/react-accordion', default: 'Accordion' }],
    // ADR-185: generated in the export, never rendered in the canvas.
    structuredData: { type: 'FAQPage', enabledBy: 'jsonLd' },
    client: {
      kind: 'always',
      reason: 'Radix Accordion holds which answers are open and manages the hidden attribute.',
    },
    notes: [
      'FAQPage JSON-LD is emitted beside this section when the jsonLd prop is on. Check the answers match the page before publishing them as structured data.',
    ],
  },

  a11y: {
    notes: [
      'Radix owns the keyboard and the ARIA: Tab between questions, Space or Enter to toggle, arrow keys to move, with aria-expanded and aria-controls wired both ways.',
      'Each question is a button inside a heading at one level below the section header, so the FAQ appears in the page outline without skipping a level.',
      'Single mode is collapsible, so a reader is never stuck with a panel they cannot close.',
      'The chevron follows the panel through Radix data-state rather than through React state, so it cannot fall out of sync with what is open.',
    ],
  },
})
