'use client'

import type { BlockDefinition, ControlDescriptor, NodeId } from '@motion-studio/schema'
import type { ReactNode } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import { ErrorBoundary } from '../../errors/error-boundary'
import { SectionErrorChip } from '../../errors/section-error-chip'

import { BlockSection } from './universal-sections/block-section'
import {
  CodeSection,
  EffectsSection,
  LayoutSection,
  MotionSection,
  StyleSection,
  TypographySection,
  orderedGroups,
} from './universal-sections/index'

export interface BlockInspectorProps {
  readonly definition: BlockDefinition
  readonly nodeIds: readonly NodeId[]
  /** Multi-selection hands in the paths every selected block shares; a single selection hands none. */
  readonly only?: ReadonlySet<string> | undefined
}

const keep = (controls: readonly ControlDescriptor[], only: ReadonlySet<string> | undefined) =>
  only === undefined ? controls : controls.filter((control) => only.has(control.path))

/**
 * The whole inspector body, generated. There is no per-block code here and there is no place to put
 * any: the sections are canonical (ADR-110) and the rows come from the block's own metadata.
 */
/**
 * One boundary per section — ARCHITECTURE.md § Error boundaries: a control that throws collapses its
 * own group to a chip and the rest of the panel keeps working.
 *
 * Per section rather than per panel because that is the difference between "the colour picker is
 * broken" and "the inspector is broken": a generated control can fail on one prop's shape, and the
 * other eight groups still edit the same node.
 */
function Section({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <ErrorBoundary
      describeDocument={() => useStudioStore.getState().document ?? null}
      fallback={({ report, reset }) => (
        <SectionErrorChip onRetry={reset} report={report} section={label} />
      )}
      where={`inspector:${label}`}
    >
      {children}
    </ErrorBoundary>
  )
}

export function BlockInspector({ definition, nodeIds, only }: BlockInspectorProps) {
  return (
    <div className="flex w-full flex-col" data-testid="block-inspector">
      {orderedGroups(definition).map(({ id, label, group }) => {
        const controls = keep(group.controls, only)

        if (controls.length === 0) {
          return null
        }

        const narrowed = { ...group, controls }

        if (id === 'layout') {
          return (
            <Section key={id} label={label}>
              <LayoutSection definition={definition} group={narrowed} nodeIds={nodeIds} />
            </Section>
          )
        }

        if (id === 'style') {
          return (
            <Section key={id} label={label}>
              <StyleSection group={narrowed} nodeIds={nodeIds} />
            </Section>
          )
        }

        if (id === 'typography') {
          return (
            <Section key={id} label={label}>
              <TypographySection group={narrowed} nodeIds={nodeIds} />
            </Section>
          )
        }

        return (
          <Section key={id} label={label}>
            <BlockSection group={narrowed} id={id} label={label} nodeIds={nodeIds} />
          </Section>
        )
      })}

      <Section label="Motion">
        <MotionSection nodeIds={nodeIds} />
      </Section>
      <Section label="Effects">
        <EffectsSection nodeIds={nodeIds} />
      </Section>
      <Section label="Code">
        <CodeSection nodeIds={nodeIds} />
      </Section>
    </div>
  )
}
