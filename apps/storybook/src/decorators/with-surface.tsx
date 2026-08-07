import { GRADIENT, NOISE_TEXTURE } from '@motion-studio/tokens'
import type { Decorator } from '@storybook/react'

import { type ToolbarGlobals, readGlobal } from './globals'

export type SurfaceSelection = 'flat' | 'photo' | 'gradient'

const SELECTIONS: readonly SurfaceSelection[] = ['flat', 'photo', 'gradient']

/**
 * Glass is a blur of what is behind it, so a glass component over a flat fill shows nothing at all.
 * These are the two backdrops that make it visible — `DESIGN_SYSTEM.md` § Glass.
 *
 * The `photo` backdrop is the noise texture rather than a photograph. What a blur needs is
 * high-frequency detail, which grain has and which the tokens package already ships as a 342-byte data
 * URL — and § Constraints forbids a story that fetches anything. The toolbar says so rather than
 * promising a picture it does not have.
 */
export const surfaceGlobal: ToolbarGlobals = {
  surface: {
    name: 'Surface',
    description: 'What sits behind the story — glass needs something to blur',
    defaultValue: 'flat',
    toolbar: {
      icon: 'photo',
      dynamicTitle: true,
      items: [
        { value: 'flat', title: 'Flat' },
        { value: 'photo', title: 'Photo (grain)' },
        { value: 'gradient', title: 'Gradient' },
      ],
    },
  },
}

/** `aurora` is the one mesh preset, which is the busiest backdrop the design system ships. */
const gradientCss = (): string => {
  const { gradient } = GRADIENT.aurora

  return gradient.kind === 'mesh'
    ? gradient.points
        .map(
          (point) =>
            `radial-gradient(circle ${point.radius}% at ${point.x}% ${point.y}%, ${point.color} 0%, transparent 100%)`,
        )
        .join(', ')
    : ''
}

const backdrop = (selection: SurfaceSelection): string | undefined => {
  if (selection === 'gradient') {
    return gradientCss()
  }

  return selection === 'photo' ? `url("${NOISE_TEXTURE}")` : undefined
}

export const withSurface: Decorator = (Story, context) => {
  const selection = readGlobal(context.globals['surface'], SELECTIONS, 'flat')

  return (
    <div
      data-surface={selection}
      className="min-h-full"
      style={{
        backgroundImage: backdrop(selection),
        // The tile is 120 px square; anything else re-samples it and the grain stops being grain.
        backgroundSize: selection === 'photo' ? '120px 120px' : undefined,
      }}
    >
      <Story />
    </div>
  )
}
