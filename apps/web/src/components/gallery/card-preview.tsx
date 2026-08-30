'use client'

import type { BlockCategory, BlockId, UnknownProps } from '@motion-studio/schema'
import type { CSSProperties, ReactNode } from 'react'

import { useIslandMount } from '../landing/use-island-mount'

import { BlockRender } from './block-render'
import { PreviewFrame } from './preview-frame'
import { PreviewSkeleton } from './preview-skeleton'

/** The width a card's preview lays the block out at — `lg`, so a block shows its wide composition. */
export const CARD_STAGE = { width: 1024, height: 640 } as const

const SURFACE = 'overflow-hidden rounded-lg border border-border-subtle bg-surface-0'

/** The same box the frame will occupy, so the swap moves nothing. */
const PLACEHOLDER: CSSProperties = {
  aspectRatio: `${CARD_STAGE.width} / ${CARD_STAGE.height}`,
}

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
 */
export function CardPreview({ id, category, props, children }: CardPreviewProps) {
  const { ref, mounted } = useIslandMount()

  return (
    <div className="pointer-events-none select-none" ref={ref}>
      {mounted ? (
        <PreviewFrame className={SURFACE} height={CARD_STAGE.height} width={CARD_STAGE.width}>
          <BlockRender category={category} fallback={<PreviewSkeleton />} id={id} props={props}>
            {children}
          </BlockRender>
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
          style={PLACEHOLDER}
        />
      )}
    </div>
  )
}
