import { cva } from 'class-variance-authority'

/**
 * Two, three or four columns, stepping down so the grid is usable at 360 px without an override — the
 * same ladder `layout/grid` uses, because a user who has learned one should not have to learn two.
 *
 * The steps query `/frame`, the section's container (ADR-356). As viewport queries they held four
 * columns on a 375 px artboard — the grid was reading the 1920 px window around it, and each cell
 * came out ~50 px wide with one word per line.
 */
/**
 * Below 640 px the row is a swipe, not a column of six — ADR-357. The card is 82 % of the band, so the
 * next one shows an edge: a slider with nothing peeking is a slider nobody swipes. `snap-mandatory`
 * lands each card on the same left edge, and `scroll-smooth` is left off because it would animate on a
 * user's swipe against their reduced-motion setting.
 *
 * The scrollbar is hidden, so the peeking card is the only affordance — that is why it is not optional.
 * The list keeps its own `tabindex` in the markup: a scrollable region has to be reachable by keyboard.
 */
const SLIDER =
  'flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:min-w-[82%] [&>*]:snap-start'

/**
 * The track runs edge to edge, the cards keep the band's gutter — ADR-357.
 *
 * `-mx-6` cancels the section's `px-6` so the scroll region reaches both edges of the screen, and
 * `px-6 scroll-px-6` puts the gutter back on the content: the first card lines up with the heading
 * above it, the last one can be scrolled fully into view, and a card leaving the viewport runs off
 * the edge rather than being clipped by an invisible margin. Inside the padding the track ended 24 px
 * short on both sides and the cards looked cut off mid-band.
 */
const SLIDER_BLEED = '-mx-6 px-6 scroll-px-6'

/** Back to a grid once there is width for one — every slider class is undone here, in order. */
const SLIDER_RESET =
  '@min-[640px]/frame:mx-0 @min-[640px]/frame:grid @min-[640px]/frame:overflow-visible @min-[640px]/frame:px-0 @min-[640px]/frame:[&>*]:min-w-0'

export const featureGridStyles = cva('list-none gap-6 p-0', {
  variants: {
    columns: {
      2: '@min-[640px]/frame:grid-cols-2',
      3: '@min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-3',
      4: '@min-[640px]/frame:grid-cols-2 @min-[1024px]/frame:grid-cols-4',
    },
    narrow: {
      stack: 'grid grid-cols-1',
      slider: `${SLIDER} ${SLIDER_BLEED} ${SLIDER_RESET}`,
    },
  },
})

/**
 * The cell is the container query's subject (`capabilities.containerQuery`, ADR-184): a three-column
 * grid at 1440 gives a cell ~420 px and the same grid at 768 gives it ~340, and the icon belongs beside
 * the text in the first case and above it in the second. A viewport query cannot tell those apart —
 * the same cell is wide in a two-column grid and narrow in a four-column one at one viewport width.
 */
export const FEATURE_CELL_CONTAINER = '@container'

export const FEATURE_CELL_BODY = 'flex flex-col gap-4 p-6 @sm:flex-row @sm:items-start @sm:gap-5'

/** The icon plate keeps its size in both arrangements; only where it sits changes. */
export const FEATURE_CELL_TEXT = 'flex min-w-0 flex-col'

export const FEATURE_TITLE = 'm-0 font-semibold text-foreground text-lg'

/**
 * `md` (16 px), not `sm`. DESIGN_SYSTEM.md § Typography puts the studio's own base at 14 px and page body
 * at 16, and a feature cell is page body — 12 px here measured as a cell nobody reads twice.
 */
export const FEATURE_BODY = 'mt-2 mb-0 text-pretty text-foreground-muted text-md'
