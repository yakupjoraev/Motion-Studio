import { cva } from 'class-variance-authority'

/**
 * The category's shared surface language. Declared here rather than imported from `marketing` for the
 * reason each category before it declared its own: a focus ring is a two-line contract, and a
 * cross-category import of one would tie a navbar's paint to a pricing table's file.
 */
export const NAV_FOCUS =
  'focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2'

/** Duration from the token, so the studio's reduced-motion override collapses it (ADR-021). */
export const NAV_TRANSITION =
  'transition-[color,background-color,border-color,box-shadow,transform,padding,opacity] [transition-duration:var(--ms-duration-fast)] [transition-timing-function:var(--ms-ease-standard)]'

/** A navigation bar runs wider than a reading measure: it is chrome, not content. */
export const NAV_INNER = 'mx-auto flex w-full max-w-7xl items-center gap-6 px-6'

export const NAV_BRAND = [
  'inline-flex shrink-0 items-center gap-2 rounded-md font-semibold text-foreground text-md tracking-tight no-underline',
  NAV_TRANSITION,
  NAV_FOCUS,
  'hover:text-accent',
].join(' ')

/**
 * A link, in the four shapes the category needs. Every variant carries the active state as **weight
 * plus a mark**, never as colour: ACCESSIBILITY.md § Non-negotiables 4, and `aria-current` is on the
 * element besides.
 */
export const navLinkStyles = cva(
  [
    'relative inline-flex items-center rounded-md text-base no-underline',
    NAV_TRANSITION,
    NAV_FOCUS,
  ].join(' '),
  {
    variants: {
      variant: {
        /** In a horizontal bar. The mark is a 2 px rule under the label. */
        bar: 'gap-1.5 px-3 py-2 text-foreground-muted after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent after:opacity-0 hover:text-foreground',
        /** In the mobile drawer, where rows are 48 px and the mark is a left rule. */
        drawer:
          'w-full gap-3 px-4 py-3 text-foreground-muted text-md before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent before:opacity-0 hover:bg-surface-2 hover:text-foreground',
        /** In a vertical sidebar. Same rule as the drawer, tighter rows. */
        rail: 'w-full gap-3 px-3 py-2 text-foreground-muted before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent before:opacity-0 hover:bg-surface-2 hover:text-foreground',
        /** Inside a dropdown panel, where the label sits above its description. */
        panel: 'w-full flex-col items-start gap-0.5 px-3 py-2.5 text-foreground hover:bg-surface-2',
      },
      active: { true: 'font-medium text-foreground', false: '' },
    },
    compoundVariants: [
      { variant: 'bar', active: true, class: 'after:opacity-100' },
      { variant: 'drawer', active: true, class: 'bg-surface-2 before:opacity-100' },
      { variant: 'rail', active: true, class: 'bg-surface-2 before:opacity-100' },
      { variant: 'panel', active: true, class: 'bg-surface-2' },
    ],
    defaultVariants: { variant: 'bar', active: false },
  },
)

export const NAV_PANEL_DESCRIPTION = 'm-0 text-foreground-muted text-base'

/**
 * The compact call to action a bar carries. 36 px rather than the marketing button's 48: a navbar is
 * chrome density, and a 48 px button in a 64 px bar leaves no bar around it.
 */
export const navActionStyles = cva(
  [
    'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-4 font-medium text-base no-underline',
    NAV_TRANSITION,
    NAV_FOCUS,
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-accent text-foreground-onAccent shadow-xs hover:bg-accent-hover',
        secondary: 'border border-border-strong bg-surface-2 text-foreground hover:bg-surface-3',
        ghost: 'px-3 text-foreground-muted hover:text-foreground',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)

/**
 * An icon-only control. 40 px square is the touch target ACCESSIBILITY.md § Targets asks for, and the
 * accessible name is the caller's obligation — every call site in the category passes one.
 */
export const NAV_ICON_BUTTON = [
  'inline-flex size-10 shrink-0 items-center justify-center rounded-md text-foreground-muted',
  NAV_TRANSITION,
  NAV_FOCUS,
  'hover:bg-surface-2 hover:text-foreground',
].join(' ')

/**
 * The page's skip link — ACCESSIBILITY.md § Landing, gallery, docs. `focus` rather than
 * `focus-visible`: it is reached by keyboard only, and a browser that disagrees about whether a
 * programmatic focus is "visible" would hide the one control a keyboard user needs first.
 */
export const SKIP_LINK = [
  'sr-only',
  'focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50',
  'focus:inline-flex focus:h-10 focus:items-center focus:rounded-md focus:border focus:border-border-strong',
  'focus:bg-surface-0 focus:px-4 focus:font-medium focus:text-base focus:text-foreground focus:no-underline focus:shadow-lg',
  NAV_FOCUS,
].join(' ')

/**
 * The label beside a glyph-only control, and the placement is the caller's.
 *
 * It is `aria-hidden` and purely visual: the control's own accessible name is the `sr-only` label inside
 * it, so nothing here is disclosed by hover — ACCESSIBILITY.md § Non-negotiables 10. It appears on focus
 * as well as on hover, which is the half a `title` attribute and most tooltip libraries get wrong.
 *
 * Radix Tooltip would need a `Tooltip.Provider` above it, and a block cannot supply an application
 * root — ADR-190.
 */
export const NAV_TOOLTIP = [
  'pointer-events-none absolute z-20 hidden whitespace-nowrap rounded-md',
  'border border-border bg-surface-2 px-2 py-1 text-base text-foreground shadow-md',
  'group-hover/nav:block group-focus-visible/nav:block',
].join(' ')

/**
 * A group heading in a sidebar or a footer column. Small, quiet, and a real heading element.
 *
 * `foreground-muted`, not `foreground-subtle`: the contrast contract asserts `subtle` at 3:1 as a **UI**
 * pair, and measured against `surface-0` it is 4.82:1 in dark and 4.10:1 in light — under the 4.5:1
 * ACCESSIBILITY.md § Non-negotiables 9 requires of text. A 12 px uppercase heading is text.
 */
export const NAV_GROUP_HEADING =
  'm-0 font-medium text-foreground-muted text-sm uppercase tracking-[0.1em]'
