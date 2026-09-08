'use client'

import type { BlockCategory, BlockId } from '@motion-studio/schema'
import { PRESETS, ThemeScope } from '@motion-studio/theme'

import { BlockRender } from '../gallery/block-render'
import { PreviewFrame } from '../gallery/preview-frame'

import { useBlockProps } from './use-block-props'

/** The block the sample was generated from — `generated/export-sample.ts` says so in its header. */
const SUBJECT = [{ id: 'hero-aurora' as BlockId, category: 'hero' as BlockCategory }] as const

/*
 * The block's own height at 1280, near enough that the pane is the component rather than the
 * component and a field of empty surface under it. The frame clips, so a few pixels either way cost
 * nothing; a hundred would have been the difference between a preview and a hole.
 */
const STAGE = { width: 1280, height: 480 } as const

/**
 * The component the file beside it exports, running.
 *
 * The section's claim is that the export *is* the thing you were looking at, and two panes are the
 * only way to make that checkable rather than asserted: the same block on the left, the bytes it came
 * out of the exporter as on the right. Both are already there — nothing is withheld behind an
 * animation, which is the decision this section has held since it was written.
 */
export function ExportSubject() {
  const props = useBlockProps(SUBJECT)

  return (
    <ThemeScope theme={PRESETS['studio-light']}>
      <PreviewFrame
        className="w-full overflow-hidden bg-surface-0"
        height={STAGE.height}
        testId="export-subject"
        width={STAGE.width}
      >
        {props === null ? null : (
          <BlockRender
            category={SUBJECT[0].category}
            fallback={<span className="block h-full" />}
            id={SUBJECT[0].id}
            props={props[0] ?? {}}
          />
        )}
      </PreviewFrame>
    </ThemeScope>
  )
}
