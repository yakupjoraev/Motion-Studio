import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { GLASS_ESCAPE_HATCH, optionsFrom } from '../../scales'
import { SECTION_FRAME_CONTROLS, sectionCopyGroup } from '../marketing.controls'
import { BODY_MAX_LENGTH, LABEL_MAX_LENGTH, TITLE_MAX_LENGTH } from '../marketing.schema'

import { pricingTableMotion } from './pricing-table.motion'
import {
  INTERVALS,
  MAX_PLANS,
  MAX_PLAN_FEATURES,
  PRICE_MAX_LENGTH,
  PRICING_LAYOUTS,
  pricingTableSchema,
} from './pricing-table.schema'

export const pricingTableDefinition = defineBlock({
  id: blockId('pricing-table'),
  name: 'Pricing table',
  description: 'Plans as cards, a feature matrix, or one compact row — with an interval toggle.',
  category: 'marketing',
  tags: ['marketing', 'pricing', 'plans', 'table', 'cta'],
  icon: 'table',

  propsSchema: pricingTableSchema,
  defaults: pricingTableSchema.parse({}),
  previewProps: pricingTableSchema.parse({
    eyebrow: '',
    heading: '',
    description: '',
    showToggle: false,
    plans: pricingTableSchema.parse({}).plans.map((plan) => ({
      ...plan,
      features: plan.features.slice(0, 3),
    })),
  }),

  slots: [],

  controls: [
    sectionCopyGroup(),
    {
      id: 'layout',
      label: 'Layout',
      controls: [
        {
          path: 'layout',
          kind: 'segmented',
          label: 'Style',
          options: { options: optionsFrom(PRICING_LAYOUTS) },
        },
        {
          path: 'highlightIndex',
          kind: 'stepper',
          label: 'Highlight',
          hint: '−1 highlights nothing; the highlighted plan comes first on a phone',
          options: { min: -1, max: MAX_PLANS - 1 },
        },
        {
          path: 'glass',
          kind: 'switch',
          label: 'Glass',
          hint: 'Needs a background behind it',
        },
        ...SECTION_FRAME_CONTROLS,
      ],
    },
    {
      id: 'content',
      label: 'Content',
      controls: [
        { path: 'currency', kind: 'text', label: 'Currency', options: { maxLength: 3 } },
        {
          path: 'interval',
          kind: 'segmented',
          label: 'Starts on',
          hint: 'Which interval the page opens with; the toggle takes it from there',
          options: { options: optionsFrom(INTERVALS) },
        },
        { path: 'showToggle', kind: 'switch', label: 'Interval toggle' },
        {
          path: 'plans',
          kind: 'list',
          label: 'Plans',
          options: {
            max: MAX_PLANS,
            labelKey: 'name',
            sortable: true,
            itemTemplate: {
              name: 'Plan',
              description: '',
              priceMonthly: '19',
              priceYearly: '190',
              badge: '',
              ctaLabel: 'Get started',
              ctaHref: '#',
              features: [],
            },
            itemControls: [
              {
                path: 'name',
                kind: 'text',
                label: 'Name',
                options: { maxLength: TITLE_MAX_LENGTH },
              },
              {
                path: 'description',
                kind: 'text',
                label: 'Description',
                options: { maxLength: BODY_MAX_LENGTH },
              },
              {
                path: 'priceMonthly',
                kind: 'text',
                label: 'Monthly',
                hint: 'A word works too — Free, Custom',
                options: { maxLength: PRICE_MAX_LENGTH },
              },
              {
                path: 'priceYearly',
                kind: 'text',
                label: 'Yearly',
                options: { maxLength: PRICE_MAX_LENGTH },
              },
              {
                path: 'badge',
                kind: 'text',
                label: 'Badge',
                hint: 'Shows on the highlighted plan only',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              {
                path: 'ctaLabel',
                kind: 'text',
                label: 'Button',
                options: { maxLength: LABEL_MAX_LENGTH },
              },
              { path: 'ctaHref', kind: 'link', label: 'Button link' },
              {
                path: 'features',
                kind: 'list',
                label: 'Features',
                options: {
                  max: MAX_PLAN_FEATURES,
                  labelKey: 'label',
                  sortable: true,
                  itemTemplate: { label: 'What this plan includes', included: true },
                  itemControls: [
                    {
                      path: 'label',
                      kind: 'text',
                      label: 'Feature',
                      options: { maxLength: BODY_MAX_LENGTH },
                    },
                    { path: 'included', kind: 'switch', label: 'Included' },
                  ],
                },
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
    requiresBackdrop: true,
    escapeHatch: GLASS_ESCAPE_HATCH,
    supportsMotion: ['entrance', 'scroll'],
    costClass: 'cheap',
  },

  defaultMotion: pricingTableMotion,

  codegen: {
    tag: 'section',
    client: {
      kind: 'whenAnyProp',
      props: ['showToggle'],
      reason:
        'The interval toggle owns the chosen interval after the first render. Without it the plans print at the interval the document stores.',
    },
  },

  a11y: {
    notes: [
      'Each plan is an <article> whose heading is its name. The price is a paragraph, not a heading: an outline reading "Free, $0, Studio, $19" tells a reader nothing.',
      'Included and excluded features carry a tick or a dash and the words "not included" off screen, so the answer never depends on colour.',
      'The matrix layout is a real table with a caption, row headers and column headers, so a cell is announced as the feature and the plan it belongs to.',
      'The interval toggle is two buttons in a labelled group with aria-pressed, reachable by Tab and operated with Space or Enter.',
      'The highlighted plan comes first when the cards stack, which is the width where only one card is on screen at a time.',
    ],
  },
})
