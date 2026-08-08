import type { BreakpointId, MotionChannel, NodeId } from '@motion-studio/schema'
import { effectId, fixtureBlockId, nodeId } from '@motion-studio/schema'
import fc from 'fast-check'

import { addEffect } from '../commands/add-effect'
import { ALIGN_EDGES, alignNodes } from '../commands/align-nodes'
import { applyThemePreset } from '../commands/apply-theme-preset'
import { clearMotion } from '../commands/clear-motion'
import { clearResponsiveProp } from '../commands/clear-responsive-prop'
import type { Command } from '../commands/command.types'
import { distributeNodes } from '../commands/distribute-nodes'
import { duplicateNodes } from '../commands/duplicate-nodes'
import { insertBlock } from '../commands/insert-block'
import { insertNode } from '../commands/insert-node'
import { moveNodes } from '../commands/move-nodes'
import { removeEffect } from '../commands/remove-effect'
import { removeNodes } from '../commands/remove-nodes'
import { renameNode } from '../commands/rename-node'
import { reorderEffect } from '../commands/reorder-effect'
import { reorderNode } from '../commands/reorder-node'
import { setDocumentMeta } from '../commands/set-document-meta'
import { setEffect } from '../commands/set-effect'
import { setLocked } from '../commands/set-locked'
import { setMotion } from '../commands/set-motion'
import { setProp } from '../commands/set-prop'
import { setResponsiveProp } from '../commands/set-responsive-prop'
import { setThemeToken } from '../commands/set-theme-token'
import { setVisibility } from '../commands/set-visibility'
import { unwrap } from '../commands/unwrap'
import { wrapInContainer } from '../commands/wrap-in-container'

/**
 * A plan, not a command: node ids are picked when the command runs, against the document the
 * sequence has produced so far. Generating the ids up front makes half the sequence address nodes a
 * `removeNodes` deleted three commands ago, and a run where everything is rejected proves nothing.
 */
export type CommandPlan = (ids: readonly NodeId[]) => Command

const at = (ids: readonly NodeId[], pick: number): NodeId =>
  ids[pick % Math.max(ids.length, 1)] ?? nodeId('node_ghost')

const many = (ids: readonly NodeId[], picks: readonly number[]): readonly NodeId[] => [
  ...new Set(picks.map((pick) => at(ids, pick))),
]

/** The catalogue with both valid and invalid payloads — a rejection is an acceptable outcome. */
export function arbitraryPlan(): fc.Arbitrary<CommandPlan> {
  const pick = fc.nat({ max: 999 })
  const picks = fc.uniqueArray(pick, { minLength: 1, maxLength: 3 })
  const index = fc.integer({ min: -2, max: 8 })
  const block = fc.constantFrom(
    fixtureBlockId('container'),
    fixtureBlockId('card'),
    fixtureBlockId('leaf'),
    fixtureBlockId('section'),
    fixtureBlockId('shell'),
  )
  const slot = fc.constantFrom('children', 'root', 'media')
  const breakpoint = fc.constantFrom<BreakpointId>('base', 'sm', 'md', 'lg')
  const channel = fc.constantFrom<MotionChannel>('entrance', 'hover', 'scroll')
  const path = fc.constantFrom('title', 'columns', 'padding.top', 'direction')
  const value = fc.oneof(
    fc.integer({ min: -4, max: 8 }),
    fc.string({ maxLength: 12 }),
    fc.boolean(),
  )
  const instanceId = fc.constantFrom('fx_1', 'fx_2', 'fx_ghost')

  return fc.oneof(
    fc.record({ blockId: block, parent: pick, index, slot }).map(
      (plan): CommandPlan =>
        (ids) =>
          insertNode({ ...plan, parentId: at(ids, plan.parent) }),
    ),
    fc.record({ blockId: block, parent: pick, index, slot }).map(
      (plan): CommandPlan =>
        (ids) =>
          insertBlock({ ...plan, parentId: at(ids, plan.parent) }),
    ),
    picks.map(
      (list): CommandPlan =>
        (ids) =>
          removeNodes({ ids: many(ids, list) }),
    ),
    fc.record({ list: picks, parent: pick, index }).map(
      (plan): CommandPlan =>
        (ids) =>
          moveNodes({
            ids: many(ids, plan.list),
            parentId: at(ids, plan.parent),
            index: plan.index,
          }),
    ),
    fc.record({ target: pick, index }).map(
      (plan): CommandPlan =>
        (ids) =>
          reorderNode({ nodeId: at(ids, plan.target), index: plan.index }),
    ),
    picks.map(
      (list): CommandPlan =>
        (ids) =>
          duplicateNodes({ ids: many(ids, list) }),
    ),
    fc.record({ target: pick, path, value }).map(
      (plan): CommandPlan =>
        (ids) =>
          setProp({ nodeId: at(ids, plan.target), path: plan.path, value: plan.value }),
    ),
    fc.record({ target: pick, breakpoint, path, value }).map(
      (plan): CommandPlan =>
        (ids) =>
          setResponsiveProp({
            nodeId: at(ids, plan.target),
            breakpoint: plan.breakpoint,
            path: plan.path,
            value: plan.value,
          }),
    ),
    fc.record({ target: pick, breakpoint, path }).map(
      (plan): CommandPlan =>
        (ids) =>
          clearResponsiveProp({
            nodeId: at(ids, plan.target),
            breakpoint: plan.breakpoint,
            path: plan.path,
          }),
    ),
    fc.record({ target: pick, channel }).map(
      (plan): CommandPlan =>
        (ids) =>
          setMotion({
            nodeId: at(ids, plan.target),
            spec: {
              presetId: 'fade-up',
              channel: plan.channel,
              trigger: { kind: 'mount' },
              params: {},
            },
          }),
    ),
    fc.record({ target: pick, channel }).map(
      (plan): CommandPlan =>
        (ids) =>
          clearMotion({ nodeId: at(ids, plan.target), channel: plan.channel }),
    ),
    pick.map(
      (target): CommandPlan =>
        (ids) =>
          addEffect({ nodeId: at(ids, target), effectId: effectId('noise') }),
    ),
    fc
      .record({ target: pick, instanceId, opacity: fc.double({ min: 0, max: 2, noNaN: true }) })
      .map(
        (plan): CommandPlan =>
          (ids) =>
            setEffect({
              nodeId: at(ids, plan.target),
              instanceId: plan.instanceId,
              opacity: plan.opacity,
            }),
      ),
    fc.record({ target: pick, instanceId }).map(
      (plan): CommandPlan =>
        (ids) =>
          removeEffect({ nodeId: at(ids, plan.target), instanceId: plan.instanceId }),
    ),
    fc.record({ target: pick, instanceId, index }).map(
      (plan): CommandPlan =>
        (ids) =>
          reorderEffect({
            nodeId: at(ids, plan.target),
            instanceId: plan.instanceId,
            index: plan.index,
          }),
    ),
    fc.record({ target: pick, name: fc.string({ maxLength: 20 }) }).map(
      (plan): CommandPlan =>
        (ids) =>
          renameNode({ nodeId: at(ids, plan.target), name: plan.name }),
    ),
    fc.record({ list: picks, hidden: fc.boolean() }).map(
      (plan): CommandPlan =>
        (ids) =>
          setVisibility({ ids: many(ids, plan.list), hidden: plan.hidden }),
    ),
    fc.record({ list: picks, locked: fc.boolean() }).map(
      (plan): CommandPlan =>
        (ids) =>
          setLocked({ ids: many(ids, plan.list), locked: plan.locked }),
    ),
    fc.record({ list: picks, blockId: block, slot }).map(
      (plan): CommandPlan =>
        (ids) =>
          wrapInContainer({ ids: many(ids, plan.list), blockId: plan.blockId, slot: plan.slot }),
    ),
    pick.map(
      (target): CommandPlan =>
        (ids) =>
          unwrap({ nodeId: at(ids, target) }),
    ),
    fc.record({ list: picks, edge: fc.constantFrom(...ALIGN_EDGES) }).map(
      (plan): CommandPlan =>
        (ids) =>
          alignNodes({ ids: many(ids, plan.list), edge: plan.edge }),
    ),
    fc
      .record({
        list: picks,
        axis: fc.constantFrom<'horizontal' | 'vertical'>('horizontal', 'vertical'),
      })
      .map(
        (plan): CommandPlan =>
          (ids) =>
            distributeNodes({ ids: many(ids, plan.list), axis: plan.axis }),
      ),
    fc.record({ path: fc.constantFrom('name', 'canvas.width', 'template', 'id'), value }).map(
      (plan): CommandPlan =>
        () =>
          setDocumentMeta(plan),
    ),
    fc.record({ path: fc.constantFrom('radiusScale', 'palette.accent', 'nope'), value }).map(
      (plan): CommandPlan =>
        () =>
          setThemeToken(plan),
    ),
    fc.constantFrom('studio-dark' as const, 'studio-light' as const).map(
      (preset): CommandPlan =>
        () =>
          applyThemePreset({ id: preset }),
    ),
  )
}
