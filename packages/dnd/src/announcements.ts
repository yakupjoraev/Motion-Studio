import type { ScreenReaderInstructions } from '@dnd-kit/core'

import type { DropTarget, DropZone } from './dnd.types'

/** What is being dragged, where it is, and what the answer to "may it go there" was. */
export interface DragState {
  readonly label: string
  readonly zone: DropZone | null
  readonly target: DropTarget | null
  /** How many children the list would have once the drop landed. */
  readonly count: number
}

export const DRAG_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'To pick up a block, press space or enter. Use the arrow keys to move it between containers and positions, space or enter to drop it, and escape to cancel.',
}

export const announceDragStart = (label: string): string =>
  `Picked up ${label}. Use arrow keys to move, space to drop, escape to cancel.`

export const announceDragCancel = (label: string): string =>
  `Cancelled. ${label} returned to its original position.`

/**
 * DRAG_AND_DROP.md § Accessibility. A rejected target says **why**: "invalid" tells a screen reader
 * user that something is wrong and nothing about what to do instead.
 */
export function announceDragOver({ label, zone, target, count }: DragState): string {
  if (zone === null || target === null) {
    return `${label} is not over a valid target.`
  }

  if (target.indicator.kind === 'reject') {
    return `${label} cannot go into ${zone.label}. ${target.indicator.reason}.`
  }

  return `${label} over ${zone.label}, position ${target.index + 1} of ${count}.`
}

export function announceDragEnd({ label, zone, target }: DragState): string {
  if (zone === null || target === null || target.indicator.kind === 'reject') {
    return announceDragCancel(label)
  }

  return `Dropped ${label} into ${zone.label} at position ${target.index + 1}.`
}
