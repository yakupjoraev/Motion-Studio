import type { PointerSensorOptions } from '@dnd-kit/core'

/**
 * DRAG_AND_DROP.md § Sensors. Below 4 px a pointer-down is a selection, and users click far more
 * often than they drag: at 0 px a click whose cursor jitters by a pixel starts a drag instead, and
 * selection stops feeling reliable.
 */
export const ACTIVATION_DISTANCE_PX = 4

export const POINTER_SENSOR_OPTIONS: PointerSensorOptions = {
  activationConstraint: { distance: ACTIVATION_DISTANCE_PX },
}
