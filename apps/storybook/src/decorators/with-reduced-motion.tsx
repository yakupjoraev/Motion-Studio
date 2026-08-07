import type { Decorator } from '@storybook/react'

import { type ToolbarGlobals, readGlobal } from './globals'

export type ReducedMotionSelection = 'system' | 'reduce'

const SELECTIONS: readonly ReducedMotionSelection[] = ['system', 'reduce']

export const reducedMotionGlobal: ToolbarGlobals = {
  reducedMotion: {
    name: 'Reduced motion',
    description: 'Force the reduced-motion design without touching OS settings',
    defaultValue: 'system',
    toolbar: {
      icon: 'play',
      dynamicTitle: true,
      items: [
        { value: 'system', title: 'System setting' },
        { value: 'reduce', title: 'Reduce motion' },
      ],
    },
  },
}

/**
 * ADR-021 split the two motion factors precisely so this is possible: every duration is
 * `calc(… * var(--ms-motion-scale) * var(--ms-reduced-motion))`, the media query sets
 * `--ms-reduced-motion` on `:root`, and an inline declaration outranks it for its own subtree.
 *
 * So forcing the reduced design is one variable on one element — no media-query emulation, and no
 * second code path in any component. The variable itself is declared in `globals.css` against the
 * attribute this writes; `system` writes nothing, leaving the query in charge.
 */
export const withReducedMotion: Decorator = (Story, context) => {
  const selection = readGlobal(context.globals['reducedMotion'], SELECTIONS, 'system')

  return (
    <div data-reduced-motion={selection === 'reduce' ? '' : undefined}>
      <Story />
    </div>
  )
}
