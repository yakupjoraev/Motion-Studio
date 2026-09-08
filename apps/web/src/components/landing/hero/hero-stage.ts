import type { BlockCategory, BlockId } from '@motion-studio/schema'

/**
 * The hero's stage, in canvas units — the same coordinate space the studio's artboard uses, so the
 * numbers under the frame are the numbers the editor would print.
 *
 * `1280` is the `lg` breakpoint frame, which is what `PreviewFrame` scales down: a block laid out at
 * 1280 px is the composition a visitor on a laptop would build, and showing it small is honest in a
 * way that laying it out at 420 px and calling it a page is not.
 */
export const STAGE = { width: 1280, height: 900 } as const

/** The palette card the visitor drags. The studio's own card is 88 px tall at 160 wide (ADR-176). */
export const CARD = { width: 244, height: 140 } as const

/** Where the card sits before anyone touches it: clear of the page, inside the frame. */
export const START: { readonly x: number; readonly y: number } = { x: 986, y: 132 }

/** CANVAS.md § Snapping. The studio's threshold; the hero has no reason to be more forgiving. */
export const SNAP_THRESHOLD = 10

export interface StageBlock {
  readonly id: BlockId
  readonly category: BlockCategory
}

/**
 * The page on the stage: three blocks out of the shipped registry, rendered by the shipped
 * components with the shipped preview props. Not a picture of a page and not a div dressed as one.
 *
 * `hero-page.test.ts` holds these three against `blockRegistry`, so a block renamed in the catalogue
 * fails here rather than rendering an empty frame on the front page.
 */
export const STAGE_PAGE: readonly StageBlock[] = [
  { id: 'navbar' as BlockId, category: 'navigation' },
  { id: 'feature-grid' as BlockId, category: 'marketing' },
  { id: 'footer' as BlockId, category: 'navigation' },
]

/**
 * The block on the card. The page above is deliberately missing its hero, so the gesture the first
 * screen offers is the one the product is for: put a block on a page and watch the page take it.
 */
export const DRAGGED_BLOCK: StageBlock = { id: 'hero-aurora' as BlockId, category: 'hero' }

/**
 * The same block as a list, because `useStageProps` takes one and a fresh `[DRAGGED_BLOCK]` written
 * at the call site is a new array on every render — which makes its effect a loop that reloads the
 * definition forever and starves the tab. Measured as a page that painted and then answered no
 * pointer event at all.
 */
export const DRAGGED_BLOCKS: readonly StageBlock[] = [DRAGGED_BLOCK]
