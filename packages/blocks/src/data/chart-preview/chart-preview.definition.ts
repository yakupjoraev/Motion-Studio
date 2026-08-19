import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { optionsFrom } from '../../scales'
import { DATA_FRAME_CONTROLS } from '../data.controls'
import {
  CELL_MAX_LENGTH,
  LABEL_MAX_LENGTH,
  MAX_SERIES_POINTS,
  SUMMARY_MAX_LENGTH,
} from '../data.schema'

import { chartPreviewMotion } from './chart-preview.motion'
import { CHART_HEIGHTS, CHART_KINDS, CHART_TONES, chartPreviewSchema } from './chart-preview.schema'

export const chartPreviewDefinition = defineBlock({
  id: blockId('chart-preview'),
  name: 'Chart preview',
  description: 'A line, area or bar chart from a numeric array, in inline SVG and no library.',
  category: 'data',
  tags: ['chart', 'graph', 'line', 'bar', 'data'],
  icon: 'wave',

  propsSchema: chartPreviewSchema,
  defaults: chartPreviewSchema.parse({}),
  previewProps: chartPreviewSchema.parse({ height: 'lg', plate: true, caption: '' }),

  slots: [],

  controls: [
    {
      id: 'data',
      label: 'Data',
      controls: [
        {
          path: 'series',
          kind: 'list',
          label: 'Values',
          hint: 'Inline, never fetched. Two points is the fewest that has a shape',
          options: { max: MAX_SERIES_POINTS, itemTemplate: 0 },
        },
        {
          path: 'labels',
          kind: 'list',
          label: 'Point names',
          hint: 'Used in the hidden table. Fewer names than points falls back to the position',
          options: { max: MAX_SERIES_POINTS, itemTemplate: '', maxLength: LABEL_MAX_LENGTH },
        },
        {
          path: 'seriesLabel',
          kind: 'text',
          label: 'What this measures',
          options: { maxLength: LABEL_MAX_LENGTH },
        },
      ],
    },
    {
      id: 'style',
      label: 'Style',
      controls: [
        {
          path: 'kind',
          kind: 'segmented',
          label: 'Kind',
          hint: 'Bars measure from zero; a line reads a trend and normalises to its own range',
          options: { options: optionsFrom(CHART_KINDS) },
        },
        {
          path: 'tone',
          kind: 'segmented',
          label: 'Tone',
          options: { options: optionsFrom(CHART_TONES) },
        },
        {
          path: 'height',
          kind: 'segmented',
          label: 'Height',
          responsive: true,
          options: { options: optionsFrom(CHART_HEIGHTS) },
        },
        {
          path: 'showGrid',
          kind: 'switch',
          label: 'Value scale',
          hint: 'Three labelled gridlines. Bars are scaled from zero, a line from its own range',
        },
        {
          path: 'showPointLabels',
          kind: 'switch',
          label: 'Point names',
          hint: 'Draws the names you gave above. Off leaves them to the screen reader only',
        },
        {
          path: 'plate',
          kind: 'switch',
          label: 'Plate',
          hint: 'A surface and a hairline around the figure, for a chart not already inside a band',
        },
        {
          path: 'caption',
          kind: 'text',
          label: 'Caption',
          options: { maxLength: CELL_MAX_LENGTH },
        },
        ...DATA_FRAME_CONTROLS,
      ],
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      controls: [
        {
          path: 'summary',
          kind: 'textarea',
          label: 'Announced summary',
          hint: 'Empty says the direction and the ends. This is what a screen reader gets instead of the drawing',
          options: { rows: 2, maxLength: SUMMARY_MAX_LENGTH },
        },
        {
          path: 'showTable',
          kind: 'switch',
          label: 'Hidden data table',
          hint: 'The real values, for a reader who wants to check the summary',
        },
      ],
    },
  ],

  capabilities: {
    resizable: false,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'],
    // Prompt 41's requirement, and it is what the block is: two path strings and no dependency.
    costClass: 'cheap',
  },

  defaultMotion: chartPreviewMotion,

  codegen: {
    tag: 'figure',
    client: {
      kind: 'never',
      reason:
        'The paths are computed from the props during render — no state, no effect, no handler.',
    },
  },

  a11y: {
    notes: [
      'The drawing is one role="img" with a summarising aria-label, because that is what it is to a screen reader: one thing with one name rather than a list of coordinates.',
      'The summary says the direction as well as the ends, since "from 12 to 84" leaves the reader to make the comparison the chart exists to make for them.',
      'The real values sit beside it in a visually hidden table with a row header per point, so a reader can check the summary rather than take it on trust.',
      'Both axes are HTML rather than SVG text, because the plot is drawn with preserveAspectRatio="none" and would stretch any text inside it; both are aria-hidden, since the hidden table carries the same numbers as a table rather than as a scatter of digits.',
      'A chart a screen reader cannot convey is decoration; this one says what it shows, and the author can replace the sentence when the series needs prose.',
      'Bars are measured from zero and a line from the series’ own range: a bar length is read as a magnitude, so any other baseline overstates every difference in the set.',
    ],
  },
})
