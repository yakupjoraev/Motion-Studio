/**
 * The swipe track a row of cards becomes on a narrow band — ADR-357.
 *
 * Here rather than in `marketing/` because `data/stat-grid` needs the same thing, and a second copy of
 * these classes is a second place for the peek percentage to drift. What each part is doing:
 *
 *   - **`[&>*]:min-w-[82%]`** — the next card peeks in. The scrollbar is hidden, so the peek is the only
 *     thing telling a reader there is more; a full-width card makes the swipe invisible.
 *   - **`-mx-6 px-6 scroll-px-6`** — the track reaches both edges of the band while the cards keep its
 *     gutter. Inside the padding the track stopped 24 px short and a card leaving the frame looked
 *     clipped by an invisible margin rather than running off the screen.
 *   - **no `scroll-smooth`** — it would animate the user's own swipe, against a reduced-motion setting.
 *
 * The list itself needs `tabindex="0"` from the block: a scrollable region has to be reachable without a
 * pointer (WCAG 2.1.1), and that is markup rather than a class.
 */
/**
 * The track takes focus, so it draws a ring — the category focus rings are declared per category for
 * the reason each of them states, and this one is declared here because the track crosses categories.
 * A focusable element with no visible focus is the defect `ACCESSIBILITY.md` § Focus exists to prevent,
 * and it is caught by the per-category a11y suite rather than left to review.
 */
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2'

const TRACK = `flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:min-w-[82%] [&>*]:snap-start ${FOCUS}`

/**
 * Added on top of the track, never removed from it: `cva` concatenates variants rather than resolving
 * them, so a compound variant can only add classes. A block that must not bleed therefore composes
 * `NARROW_SLIDER_INSET` and adds this where it applies, rather than starting from the bleeding track
 * and trying to take it back.
 */
export const NARROW_BLEED = '-mx-6 px-6 scroll-px-6'

const BLEED = NARROW_BLEED

/** Every track class undone, in order, once the band is wide enough for the grid. */
const RESET =
  '@min-[640px]/frame:mx-0 @min-[640px]/frame:grid @min-[640px]/frame:overflow-visible @min-[640px]/frame:px-0 @min-[640px]/frame:[&>*]:min-w-0'

export const NARROW_SLIDER = `${TRACK} ${BLEED} ${RESET}`

/**
 * The same track without the bleed, for a row that sits on a drawn plate — `stat-grid` with dividers
 * is the case. Bleeding there would drag the plate's own rounded border off both edges of the band,
 * which reads as a broken frame rather than as a slider. The peek still does the telling.
 */
export const NARROW_SLIDER_INSET = `${TRACK} ${RESET}`

/** The other half of the choice: one column, full width, no gesture. */
export const NARROW_STACK = 'grid grid-cols-1'
