'use client'

import type { BlockDefinition, ControlDescriptor, NodeId } from '@motion-studio/schema'
import type { ReactNode } from 'react'

import { controlLabel } from '@motion-studio/blocks/i18n/translate'

import { useRegistryCopy, useStudio } from '../../../lib/i18n/studio-surface'
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
function Section({
  label,
  title,
  children,
}: {
  /** The English label the report is filed under — a section name a maintainer can search for. */
  readonly label: string
  /** The same section in the reader's language, which is what the chip says. */
  readonly title: string
  readonly children: ReactNode
}) {
  return (
    <ErrorBoundary
      describeDocument={() => useStudioStore.getState().document ?? null}
      fallback={({ report, reset }) => (
        <SectionErrorChip onRetry={reset} report={report} section={title} />
      )}
      where={`inspector:${label}`}
    >
      {children}
    </ErrorBoundary>
  )
}

export function BlockInspector({ definition, nodeIds, only }: BlockInspectorProps) {
  const { panels } = useStudio()
  const copy = useRegistryCopy()

  return (
    <div className="flex w-full flex-col" data-testid="block-inspector">
      {orderedGroups(definition).map(({ id, label, group }) => {
        const controls = keep(group.controls, only)

        if (controls.length === 0) {
          return null
        }

        const narrowed = { ...group, controls }
        // A block's own group heading — the registry's table, keyed by the English string.
        const title = controlLabel(copy, label)

        if (id === 'layout') {
          return (
            <Section key={id} label={label} title={panels.sectionLayout}>
              <LayoutSection definition={definition} group={narrowed} nodeIds={nodeIds} />
            </Section>
          )
        }

        if (id === 'style') {
          return (
            <Section key={id} label={label} title={panels.sectionStyle}>
              <StyleSection group={narrowed} nodeIds={nodeIds} />
            </Section>
          )
        }

        if (id === 'typography') {
          return (
            <Section key={id} label={label} title={panels.sectionTypography}>
              <TypographySection group={narrowed} nodeIds={nodeIds} />
            </Section>
          )
        }

        return (
          <Section key={id} label={label} title={title}>
            <BlockSection group={narrowed} id={id} label={title} nodeIds={nodeIds} />
          </Section>
        )
      })}

      <Section label="Motion" title={panels.sectionMotion}>
        <MotionSection nodeIds={nodeIds} />
      </Section>
      <Section label="Effects" title={panels.sectionEffects}>
        <EffectsSection nodeIds={nodeIds} />
      </Section>
      <Section label="Code" title={panels.sectionCode}>
        <CodeSection nodeIds={nodeIds} />
      </Section>
    </div>
  )
}
