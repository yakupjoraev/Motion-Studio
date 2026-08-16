'use client'

import { commands } from '@motion-studio/editor'
import { EASINGS, type MotionPreset, SPRINGS } from '@motion-studio/motion'
import type { MotionSpec, NodeId } from '@motion-studio/schema'
import { ControlRenderer, ControlRow, CurveEditor, SpringEditor } from '@motion-studio/ui'
import { useCallback } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { nearestEasing, nearestSpring } from './nearest-curve'

const isEasingName = (value: unknown): value is keyof typeof EASINGS =>
  typeof value === 'string' && value in EASINGS

const isSpringName = (value: unknown): value is keyof typeof SPRINGS =>
  typeof value === 'string' && value in SPRINGS

/**
 * A preset's own controls, rendered through the same generated control system a block's props use —
 * `preset.controls` exists for exactly this. The curve editors sit beside them when the preset takes
 * a named curve, so stiffness is a thing you drag rather than a word you pick from a list.
 *
 * Every write is `setMotion`, which carries a coalesce key: a drag is one history entry.
 */
export function MotionParams({
  preset,
  spec,
  nodeId,
}: {
  readonly preset: MotionPreset
  readonly spec: MotionSpec
  readonly nodeId: NodeId
}) {
  const write = useCallback(
    (key: string, value: number | string | boolean) => {
      useStudioStore.getState().dispatch(
        commands.setMotion({
          nodeId,
          spec: { ...spec, params: { ...spec.params, [key]: value } },
        }),
      )
    },
    [nodeId, spec],
  )

  const easing = spec.params['easing']
  const spring = spec.params['spring']

  return (
    <div className="flex flex-col" data-testid="motion-params">
      {preset.controls.map((descriptor) => (
        <ControlRow key={descriptor.path} label={descriptor.label}>
          {(slot) => (
            <ControlRenderer
              descriptor={descriptor}
              onChange={(value) => write(descriptor.path, value as number | string | boolean)}
              onCommit={(value) => write(descriptor.path, value as number | string | boolean)}
              slot={slot}
              value={spec.params[descriptor.path] ?? preset.defaults[descriptor.path]}
            />
          )}
        </ControlRow>
      ))}

      {isEasingName(easing) ? (
        <ControlRow label="Curve">
          {(slot) => (
            <CurveEditor
              {...slot}
              label="Easing curve"
              onChange={(curve) => write('easing', nearestEasing(curve))}
              onCommit={(curve) => write('easing', nearestEasing(curve))}
              value={EASINGS[easing]}
            />
          )}
        </ControlRow>
      ) : null}

      {isSpringName(spring) ? (
        <ControlRow label="Spring">
          {(slot) => (
            <SpringEditor
              {...slot}
              label="Spring"
              onChange={(config) => write('spring', nearestSpring(config))}
              onCommit={(config) => write('spring', nearestSpring(config))}
              value={SPRINGS[spring]}
            />
          )}
        </ControlRow>
      ) : null}
    </div>
  )
}
