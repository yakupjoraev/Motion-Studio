import type { BlockId } from '@motion-studio/schema'

/** The width a card's preview lays the block out at — `lg`, so a block shows its wide composition. */
export const CARD_STAGE_WIDTH = 1024

/**
 * The stage height for a block that lays out no height of its own: an effect layer fills its parent
 * absolutely, so its picture is the whole plate.
 */
export const PLATE_HEIGHT = 640

/**
 * The heights a stage is allowed to be, in stage pixels — 95, 136, 176, 217, 258, 298 and 359 screen
 * pixels at this scale.
 *
 * A stage sized to each block exactly leaves every card in a row a different height, and since the
 * name sits under the picture, the row's three names end up on three different lines. A scale means
 * neighbours usually land on the same step and the row reads as a row. The floor keeps the picture
 * from being smaller than the name and description under it — those occupy 88 screen pixels — and the
 * ceiling is above the tallest block in the catalogue, which lays out at 960, because clipping it is
 * the defect this table exists to remove.
 */
const STAGE_STEPS = [280, 400, 520, 640, 760, 880, 1060] as const

/** The least air a block gets, so nothing is flush against the frame's edge. 16 screen pixels. */
const MIN_AIR = 48

/**
 * How tall each block lays out at `CARD_STAGE_WIDTH`, measured in a browser — ADR-386. Zero means the
 * block reports no height of its own, which is what an effect layer does.
 *
 * These are measurements, not preferences, and `e2e/gallery/card-stage.spec.ts` fails when a block's
 * real height moves away from its entry: a stage taller than its block is the wall of air this table
 * exists to remove, and a shorter one cuts the block off.
 *
 * **An entry is the tallest height the block has been measured at, not the height it happens to be
 * here.** A block's height is a function of the font it is laid out in, and two machines running the
 * same browser do not agree about the font: `testimonial-marquee` lays out at 562 on the author's
 * machine and 642 on the runner — one extra line inside a testimonial — which put it two pixels past
 * a 640 stage and cut it off in CI while passing locally. The stage has to hold the tallest of them,
 * because the safe direction is air.
 */
const BLOCK_HEIGHT: Readonly<Record<string, number>> = {
  section: 304,
  container: 336,
  stack: 288,
  grid: 128,
  columns: 288,
  spacer: 96,
  divider: 46,
  'hero-centered': 528,
  'hero-split': 960,
  'hero-aurora': 469,
  'hero-video': 450,
  'hero-terminal': 436,
  'hero-app-preview': 436,
  heading: 54,
  text: 80,
  'rich-text': 54,
  image: 602,
  video: 602,
  'code-block': 180,
  quote: 176,
  stat: 146,
  badge: 28,
  'feature-grid': 584,
  'feature-split': 392,
  'bento-grid': 482,
  'pricing-table': 499,
  'testimonial-card': 188,
  'testimonial-marquee': 642,
  'logo-cloud': 208,
  'cta-banner': 387,
  'cta-split': 305,
  'faq-accordion': 416,
  'comparison-table': 368,
  'newsletter-form': 207,
  navbar: 64,
  'navbar-floating': 58,
  'sidebar-nav': 554,
  footer: 376,
  breadcrumbs: 24,
  dock: 62,
  button: 48,
  'button-group': 54,
  tabs: 198,
  accordion: 344,
  carousel: 294,
  'modal-trigger': 264,
  'tooltip-target': 48,
  'command-menu-preview': 423,
  'theme-toggle': 42,
  table: 234,
  'stat-grid': 197,
  'progress-ring': 198,
  timeline: 549,
  'chart-preview': 258,
  'input-field': 134,
  'select-field': 134,
  'checkbox-field': 196,
  'contact-form': 685,
  'waitlist-form': 198,
  'aurora-background': 0,
  'mesh-gradient': 0,
  'noise-overlay': 0,
  'grain-overlay': 0,
  'dot-grid': 0,
  'grid-lines': 0,
  spotlight: 0,
  beams: 0,
  glow: 0,
  'border-beam': 0,
  shine: 0,
  particles: 0,
  scanlines: 0,
}

export interface CardStage {
  readonly width: number
  readonly height: number
  /** Padding above and below the block, so the air it sits in is symmetrical. */
  readonly air: number
}

/**
 * The stage one card lays its block out on.
 *
 * One stage for every block put half the catalogue behind a wall of air — a `divider` filled 2 % of
 * its card and a `heading` 8 % — while `hero-split` and `contact-form` overflowed theirs and were cut
 * off (ADR-386). The height comes from the table above rather than from a measurement in the visitor's
 * browser because a transform is invisible to layout: measuring it means painting the wrong box first,
 * which measured as 0.16 of layout shift on load against a 0.02 budget.
 *
 * A block with no entry gets the plate. That is the safe direction: air, not a cut-off block.
 */
export function cardStage(id: BlockId): CardStage {
  const block = BLOCK_HEIGHT[id]

  if (block === undefined || block === 0) {
    return { width: CARD_STAGE_WIDTH, height: PLATE_HEIGHT, air: 0 }
  }

  const wanted = block + MIN_AIR
  const height = STAGE_STEPS.find((step) => step >= wanted) ?? STAGE_STEPS.at(-1) ?? PLATE_HEIGHT

  return { width: CARD_STAGE_WIDTH, height, air: Math.max(0, Math.round((height - block) / 2)) }
}

/** Every block the table names, for the test that keeps it and the registry in step. */
export const stagedBlockIds = (): readonly string[] => Object.keys(BLOCK_HEIGHT)

/** What the table says a block lays out at, for the spec that measures the real thing. */
export const measuredBlockHeight = (id: string): number | undefined => BLOCK_HEIGHT[id]
