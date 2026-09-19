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
  /**
   * How tall the block lays out at `STAGE.width`, measured in a browser — the discipline
   * `gallery/card-stage.ts` records under ADR-386, for the same reason and a different symptom.
   *
   * Each block on this stage arrives on its own, behind its own fallback. A fallback that is not the
   * block's height moves everything below it when the block lands, and the first screen is the one
   * page in the product whose layout shift is a public budget: measured at **0.027 CLS** against
   * 0.02, from placeholders of 96 px standing in for blocks of 606 and 376 (ADR-409).
   *
   * `flows/landing-stability.spec.ts` is the gate. It asserts the shift rather than these numbers,
   * because a block's height is a function of the font and two machines do not agree about the font
   * — ADR-280, and the same trap `card-stage.spec.ts` fell into first.
   */
  readonly height: number
}

/**
 * The page on the stage: three blocks out of the shipped registry, rendered by the shipped
 * components with the shipped preview props. Not a picture of a page and not a div dressed as one.
 *
 * `hero-page.test.ts` holds these three against `blockRegistry`, so a block renamed in the catalogue
 * fails here rather than rendering an empty frame on the front page.
 */
export const STAGE_PAGE: readonly StageBlock[] = [
  { id: 'navbar' as BlockId, category: 'navigation', height: 65 },
  { id: 'feature-grid' as BlockId, category: 'marketing', height: 606 },
  { id: 'footer' as BlockId, category: 'navigation', height: 376 },
]

/**
 * The block on the card. The page above is deliberately missing its hero, so the gesture the first
 * screen offers is the one the product is for: put a block on a page and watch the page take it.
 */
export const DRAGGED_BLOCK: StageBlock = {
  id: 'hero-aurora' as BlockId,
  category: 'hero',
  height: 501,
}

/**
 * The same block as a list, because `useBlockProps` takes one and a fresh `[DRAGGED_BLOCK]` written
 * at the call site is a new array on every render — which makes its effect a loop that reloads the
 * definition forever and starves the tab. Measured as a page that painted and then answered no
 * pointer event at all.
 */
export const DRAGGED_BLOCKS: readonly StageBlock[] = [DRAGGED_BLOCK]
