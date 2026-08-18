import { cva } from 'class-variance-authority'

/**
 * The category's shared surface language. One focus ring, one transition, one control geometry — so a
 * `button` beside a tab trigger beside a `theme-toggle` segment reads as one system rather than as three
 * blocks that happened to land on the same page.
 */
export const INTERACTIVE_FOCUS =
  'focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2'

/** Every duration is a token, so reduced motion collapses it — ADR-021, and why no number appears here. */
export const INTERACTIVE_TRANSITION =
  'transition-[color,background-color,border-color,box-shadow,transform,opacity] [transition-duration:var(--ms-duration-fast)] [transition-timing-function:var(--ms-ease-standard)]'

/**
 * The control.
 *
 * **This is not `packages/ui`'s Button and must not become it.** `ui/button` is studio chrome: 24 px and
 * 28 px tall, 11 px text, `rounded-sm`, and it lives in a panel beside forty other controls. A block is
 * *user content* that gets exported into someone else's project, at content density — the `md` row below
 * is the marketing CTA's own geometry, `h-12` and 16 px text, because a button next to a pricing table
 * has to be the same size as the pricing table's button.
 *
 * What the two share is the **token vocabulary**, and that is the whole of what they should share: the
 * same `accent` for primary, the same `border-strong` hairline for secondary, the same focus ring. Sharing
 * the component instead would mean either the chrome grew content props or the export shipped a studio
 * class list, and the export is the reason this is a separate implementation rather than a wrapper.
 */
export const controlStyles = cva(
  [
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium no-underline',
    INTERACTIVE_TRANSITION,
    INTERACTIVE_FOCUS,
    'disabled:pointer-events-none disabled:opacity-55',
    'aria-disabled:pointer-events-none aria-disabled:opacity-55',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-foreground-onAccent shadow-md hover:bg-accent-hover active:bg-accent-active',
        secondary:
          'border border-border-strong bg-surface-2 text-foreground shadow-xs hover:bg-surface-3',
        ghost: 'text-foreground-muted hover:bg-surface-2 hover:text-foreground',
        danger: 'bg-danger text-foreground-onAccent shadow-md hover:opacity-90 active:opacity-100',
      },
      /*
       * Height, padding and text size travel together, and the padding is **not** varied per variant: two
       * `px-*` utilities on one element are resolved by the order Tailwind emits them in rather than by the
       * order they are written, so a `ghost` row that tried to tighten its own padding would be deciding
       * nothing. A ghost control reads as quieter because it has no plate, not because it is narrower.
       */
      size: {
        sm: 'h-10 px-4 text-base',
        md: 'h-12 px-6 text-md',
        lg: 'h-14 px-7 text-lg',
      },
      fullWidth: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', fullWidth: false },
  },
)

/** The glyph inside a control, in the size that pairs with each row height. */
export const ICON_SIZE: Readonly<Record<'sm' | 'md' | 'lg', number>> = { sm: 16, md: 18, lg: 20 }

/**
 * The surface the category's panels sit on — a tab panel, an accordion, a slide, a dialog. A hairline and
 * one step of surface rather than a shadow: DESIGN_SYSTEM.md § Elevation reserves shadow for things that
 * float, and a panel inside a section does not.
 */
export const INTERACTIVE_PANEL = 'rounded-lg border border-border bg-surface-1'

/**
 * A measure on the fallback prose, and it is not decoration: a panel is as wide as the block it is in, and at
 * 1440 that is a 1360 px line — DESIGN_SYSTEM.md § Typography puts a reading measure at around 65 characters,
 * which is what `max-w-2xl` is. Inside a card the class is a no-op, because the card is already narrower.
 */
export const INTERACTIVE_BODY = 'm-0 max-w-2xl text-pretty text-base text-foreground-muted'

export const INTERACTIVE_HEADING = 'm-0 font-medium text-foreground text-md tracking-tight'

/**
 * A 40 px square glyph control — a carousel arrow, a dialog close. The touch target ACCESSIBILITY.md
 * § Targets asks for, and the accessible name is the caller's obligation at every call site.
 */
export const ICON_CONTROL = [
  'inline-flex size-10 shrink-0 items-center justify-center rounded-md',
  'border border-border bg-surface-2 text-foreground-muted',
  INTERACTIVE_TRANSITION,
  INTERACTIVE_FOCUS,
  'hover:border-border-strong hover:bg-surface-3 hover:text-foreground',
  'disabled:pointer-events-none disabled:opacity-40',
].join(' ')
