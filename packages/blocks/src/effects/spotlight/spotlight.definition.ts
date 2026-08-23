import { blockId } from '@motion-studio/schema'

import { defineBlock } from '../../define-block'
import { EFFECT_A11Y_NOTES, effectCapabilities, intensityControl, tintControl } from '../shared'

import { SPOTLIGHT_REACH, spotlightSchema } from './spotlight.schema'

export const spotlightDefinition = defineBlock({
  id: blockId('spotlight'),
  name: 'Spotlight',
  description: 'A soft light that follows the pointer, written from the shared pointer bus.',
  category: 'effects',
  tags: ['effect', 'cursor', 'light', 'spotlight'],
  icon: 'cursor-follow',

  propsSchema: spotlightSchema,
  defaults: spotlightSchema.parse({}),
  previewProps: spotlightSchema.parse({ intensity: 0.5, reach: 55 }),

  slots: [],

  controls: [
    {
      id: 'style',
      label: 'Style',
      controls: [
        tintControl('tint'),
        intensityControl('intensity'),
        { path: 'reach', kind: 'slider', label: 'Reach', options: SPOTLIGHT_REACH },
      ],
    },
    {
      id: 'motion',
      label: 'Motion',
      controls: [
        {
          path: 'followPointer',
          kind: 'switch',
          label: 'Follow pointer',
          hint: 'Off pins the light to the centre — the same composition a touch device gets',
        },
      ],
    },
  ],

  capabilities: effectCapabilities('moderate'),
  defaultMotion: {},
  codegen: {
    tag: 'div',
    client: {
      kind: 'whenAnyProp',
      props: ['followPointer'],
      reason:
        'Following the cursor writes two custom properties from the pointer bus. Pinned, the light is one gradient in CSS.',
    },
  },
  a11y: {
    notes: [
      ...EFFECT_A11Y_NOTES,
      'Pointer-driven and therefore absent on a touch device or with a keyboard: the centred composition is the design, not a fallback.',
      'Subscribes to the shared pointer bus; it adds no listener of its own and causes no render while the pointer moves.',
    ],
  },
})
