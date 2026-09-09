'use client'

import type { BlockCategory, BlockId, UnknownProps } from '@motion-studio/schema'
import type { ReactNode } from 'react'

import { useIslandMount } from '../landing/use-island-mount'

import { BlockRender } from './block-render'
import { cardStage } from './card-stage'
import { PreviewFrame } from './preview-frame'
import { PreviewSkeleton } from './preview-skeleton'

const SURFACE = 'overflow-hidden rounded-lg border border-border-subtle bg-surface-0'

export interface CardPreviewProps {
  readonly id: BlockId
  readonly category: BlockCategory
  readonly props: UnknownProps
  readonly children?: ReactNode
}

/**
 * The only client code on `/blocks` besides the search box.
 *
 * A card's picture is the block itself, running. `prompts/52` could have had a screenshot here and
 * `VISION.md` § The problem is the reason it does not: the complaint the product answers is that a
 * catalogue shows you pictures of effects you cannot touch. A gallery of screenshots would make that
 * complaint about us.
 *
 * The block's chunk is fetched half a viewport before the card arrives and never before that, so a
 * visitor who reads two rows downloads two rows.
 *
 * **The container query context is created on mount, not before.** `PreviewFrame` scales its stage
 * with `100cqw`, which costs a containment context per card, and seventy-two of them on first paint
 * measured as 545 ms of Style & Layout and a 250 ms TBT — ADR-304. An unmounted card is an
 * aspect-ratio box, which is the same geometry and none of the work.
 *
 * **The stage is as tall as its block, from `card-stage.ts`.** One stage for every block put half the
 * catalogue behind a wall of air — a `divider` filled 2 % of its card, a `heading` 8 % — while
 * `hero-split` and `contact-form` overflowed theirs and were cut off (ADR-386). The height is a
 * measurement that ships with the app rather than one taken here, because a transform is invisible to
 * layout: measuring it in the visitor's browser means painting the wrong box first, and that measured
 * as 0.16 of layout shift on load against a 0.02 budget.
 */
export function CardPreview({ id, category, props, children }: CardPreviewProps) {
  const { ref, mounted } = useIslandMount()
  const stage = cardStage(id)

  return (
    /*
      `data-block-height` is the table's number, in the document: `e2e/gallery/card-stage.spec.ts`
      measures the block and compares. A spec cannot import the table — `e2e` is a package and
      reaching into `apps/web/src` across that boundary is banned — and a spec with its own copy of
      seventy-two numbers is two tables that disagree by the second edit.
    */
    <div
      className="pointer-events-none select-none"
      data-block-height={stage.height - stage.air * 2}
      ref={ref}
    >
      {mounted ? (
        <PreviewFrame className={SURFACE} height={stage.height} width={stage.width}>
          {/* The air is a padding on a block wrapper rather than a flex centring rule: changing the
              stage's display changes how the block inside measures itself — ADR-379. */}
          <div style={{ paddingBlock: `${stage.air}px` }}>
            <BlockRender category={category} fallback={<PreviewSkeleton />} id={id} props={props}>
              {children}
            </BlockRender>
          </div>
        </PreviewFrame>
      ) : (
        /*
          Still, not pulsing. A skeleton animates to say "something is coming"; a card nobody has
          scrolled to is not waiting for anything, and seventy-two `animate-pulse` boxes are
          seventy-two running animations on first paint — ADR-304 has what that measured.
        */
        <div
          className={`${SURFACE} bg-surface-1`}
          data-testid="preview-placeholder"
          style={{ aspectRatio: `${stage.width} / ${stage.height}` }}
        />
      )}
    </div>
  )
}
