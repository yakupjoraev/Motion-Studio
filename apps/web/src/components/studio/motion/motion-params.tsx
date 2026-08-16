'use client'

import { commands } from '@motion-studio/editor'
import { EASINGS, type MotionPreset, SPRINGS } from '@motion-studio/motion'
import type { MotionSpec, NodeId } from '@motion-studio/schema'
import {
  ControlRenderer,
  ControlRow,
  type CubicBezier,
  CurveEditor,
  SpringEditor,
  type SpringValue,
} from '@motion-studio/ui'
import { useCallback, useState } from 'react'

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

  /*
   * The spec stores only what the user changed, so an untouched preset has an empty `params` — the
   * value comes from the preset's own defaults. Reading `spec.params` alone is why the editors did
   * not appear at all on a freshly applied preset, which the browser walkthrough caught.
   */
  const easing = spec.params['easing'] ?? preset.defaults['easing']
  const spring = spec.params['spring'] ?? preset.defaults['spring']

  /*
   * The drag is continuous and the commit snaps to a named curve (ADR-151). Without a draft the
   * editor would be pinned to the name's own values while the pointer moved — measured in the
   * browser: dragging stiffness left the handle exactly where it started, which reads as a broken
   * control rather than as a quantised one. The draft is what moves; the document still gets a name.
   */
  const [curveDraft, setCurveDraft] = useState<CubicBezier | null>(null)
  const [springDraft, setSpringDraft] = useState<SpringValue | null>(null)

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
              onChange={(curve) => {
                setCurveDraft(curve)
                write('easing', nearestEasing(curve))
              }}
              onCommit={(curve) => {
                setCurveDraft(null)
                write('easing', nearestEasing(curve))
              }}
              value={curveDraft ?? EASINGS[easing]}
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
              onChange={(config) => {
                setSpringDraft(config)
                write('spring', nearestSpring(config))
              }}
              onCommit={(config) => {
                setSpringDraft(null)
                write('spring', nearestSpring(config))
              }}
              value={springDraft ?? SPRINGS[spring]}
            />
          )}
        </ControlRow>
      ) : null}
    </div>
  )
}
