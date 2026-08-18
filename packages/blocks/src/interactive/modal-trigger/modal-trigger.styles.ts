import { cva } from 'class-variance-authority'

import { INTERACTIVE_FOCUS } from '../interactive.styles'

export const modalRootStyles = cva('flex w-full min-w-0 flex-col items-start gap-4', {
  variants: { hidden: { true: 'hidden', false: 'flex' } },
  defaultVariants: { hidden: false },
})

export const MODAL_PREVIEW = 'flex w-full min-w-0 flex-col gap-1.5'

/**
 * The frame the dialog is portalled into — ADR-205.
 *
 * It is `relative` because the overlay and the content are positioned against it rather than against the
 * viewport, and it keeps its height whether the dialog is open or closed: a frame that collapsed would move
 * the page every time the dialog opened.
 *
 * `surface-2` rather than the page's own surface, and that is what makes the scrim visible: in dark mode
 * `surface-0` is the darkest step there is, so a dimming overlay over a frame painted `surface-0` dims nothing.
 * A plate one value up gives the overlay something to darken in dark mode and something to lighten in light.
 *
 * A dashed edge so it reads as a preview of something rather than as a panel that is part of the design. The
 * export has no frame at all — it portals to the document body.
 */
export const MODAL_FRAME =
  'relative isolate flex min-h-44 w-full items-center justify-center overflow-hidden rounded-lg border border-border-strong border-dashed bg-surface-2 p-4'

/** Above the frame rather than inside it, so the scrim cannot make the frame's own label unreadable. */
export const MODAL_FRAME_LABEL =
  'm-0 font-medium text-foreground-muted text-sm uppercase tracking-[0.08em]'

export const MODAL_FRAME_EMPTY = 'm-0 max-w-prose text-center text-base text-foreground-muted'

/**
 * Absolute rather than fixed: it covers the frame, which is the whole point of the frame. The wash is the page
 * surface at 75 % plus a blur, which is a scrim in both modes — it pulls the plate underneath back toward the
 * page colour rather than assuming there is a darker colour available, which in dark mode there is not.
 */
export const MODAL_OVERLAY = 'absolute inset-0 z-10 bg-surface-0/75 backdrop-blur-[3px]'

export const modalContentStyles = cva(
  [
    'absolute z-20 flex w-full flex-col gap-3 rounded-lg border border-border-strong bg-surface-1 p-5 shadow-lg',
    INTERACTIVE_FOCUS,
  ].join(' '),
  {
    variants: {
      size: { sm: 'max-w-72', md: 'max-w-96', lg: 'max-w-[32rem]' },
    },
    defaultVariants: { size: 'md' },
  },
)

export const MODAL_TITLE = 'm-0 font-semibold text-foreground text-lg tracking-tight'

export const MODAL_DESCRIPTION = 'm-0 text-pretty text-base text-foreground-muted'

/**
 * The close button transitions **colour only**, not the category's full property list, and the reason is
 * measurable rather than stylistic: Radix moves focus here when the dialog opens, and a `box-shadow` in the
 * transition list starts a 120 ms transition on that focus even though this control has no shadow to change.
 * The thumbnail generator asks the page whether anything is animating (ADR-182) and would answer yes, so the
 * block shipped a two-second hover clip of a focus ring settling. Narrowing the list removed it.
 */
const MODAL_CLOSE_TRANSITION =
  'transition-[color,background-color] [transition-duration:var(--ms-duration-fast)] [transition-timing-function:var(--ms-ease-standard)]'

export const MODAL_CLOSE = [
  'absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-md text-foreground-muted',
  MODAL_CLOSE_TRANSITION,
  INTERACTIVE_FOCUS,
  'hover:bg-surface-2 hover:text-foreground',
].join(' ')

export const MODAL_BODY = 'flex min-w-0 flex-col gap-3 pt-1'
