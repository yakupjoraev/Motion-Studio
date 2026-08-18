import { z } from 'zod'

import {
  ICON_NAME_MAX_LENGTH,
  activeHrefField,
  navFrameFields,
  navLinkSchema,
} from '../navigation.schema'

export const MAX_DOCK_ITEMS = 8

export const dockItemSchema = navLinkSchema.extend({
  icon: z.string().max(ICON_NAME_MAX_LENGTH).default('grid'),
})

export type DockItem = z.infer<typeof dockItemSchema>

export const dockSchema = z.object({
  items: z
    .array(dockItemSchema)
    .min(1)
    .max(MAX_DOCK_ITEMS)
    .default([
      { label: 'Canvas', href: '#canvas', icon: 'hero' },
      { label: 'Blocks', href: '#blocks', icon: 'grid' },
      { label: 'Layers', href: '#layers', icon: 'layout-rows' },
      { label: 'Motion', href: '#motion', icon: 'timeline' },
      { label: 'Theme', href: '#theme', icon: 'palette' },
      { label: 'Export', href: '#export', icon: 'export' },
    ]),
  /** How large the item under the cursor gets. 2 is the ceiling: past it the row jumps rather than swells. */
  magnification: z.number().min(1).max(2).default(1.55),
  /** How far the swell reaches, in pixels either side of the cursor. */
  reach: z.number().int().min(40).max(280).default(140),
  ...activeHrefField(),
  ...navFrameFields('Shortcuts'),
})

export type DockProps = z.infer<typeof dockSchema>

/**
 * How much an item grows, given how far its centre is from the cursor.
 *
 * `smoothstep` on the falloff rather than the falloff itself, and the difference is visible: a linear ramp
 * makes the row a triangle with a hard apex, and the eased one makes it a wave. macOS uses the wave.
 *
 * Beyond `reach` the answer is exactly 1, so an item far from the cursor is not merely almost unscaled.
 */
export function dockScale(distance: number, reach: number, magnification: number): number {
  if (reach <= 0) {
    return 1
  }

  const falloff = Math.max(0, 1 - Math.abs(distance) / reach)
  const eased = falloff * falloff * (3 - 2 * falloff)

  return 1 + (magnification - 1) * eased
}

/** `null` for a key the dock does not answer, so the handler leaves the event alone. */
export function nextDockIndex(key: string, index: number, count: number): number | null {
  if (count === 0) {
    return null
  }

  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count
    case 'ArrowLeft':
      return (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}
