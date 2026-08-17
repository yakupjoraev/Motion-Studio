import type { RadiusToken } from '@motion-studio/tokens'
import { cva } from 'class-variance-authority'

import { MARKETING_TRANSITION } from './marketing.styles'
import { innerRadiusClass } from './nested-radius'

/**
 * Every card in the marketing category is this surface, and its radius is stated once here so that
 * `innerRadiusClass(CARD_RADIUS, gap)` is the only way anything inside one gets a corner.
 *
 * `xl` (16 px) rather than `lg`: measured against the reference's card treatment, a 12 px corner on a
 * card 320 px wide reads as a panel and a 16 px one reads as a card. The theme's `radiusScale` still
 * takes the whole document sharp or soft from one control.
 */
export const CARD_RADIUS: RadiusToken = 'xl'

/** The padding a card holds its content at, and the gap the nested-radius rule is computed from. */
export const CARD_PADDING_PX = 8

/**
 * Depth is layered rather than pushed: a hairline that catches light, a surface one step off the page,
 * and `shadow-sm` — which in dark mode *is* the inner top highlight (DESIGN_SYSTEM.md § Elevation), not
 * a stronger shadow. Three quiet signals read as expensive; one loud shadow reads as a template.
 *
 * `glass` reads the theme's own recipe through `--ms-glass-*` rather than hard-coding a blur, so a
 * document on the `paper` preset (glassLevel `none`) gets an opaque card instead of a smudge.
 */
export const cardStyles = cva(
  ['relative flex flex-col rounded-xl', MARKETING_TRANSITION].join(' '),
  {
    variants: {
      treatment: {
        plain: '',
        card: 'border border-border bg-surface-1 shadow-sm',
        glass: 'ms-glass shadow-md',
      },
      /** A card the pointer can act on says so before it is touched, and lifts when it is. */
      interactive: {
        true: 'hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg',
        false: '',
      },
      /** The accent-bordered plan, the featured bento cell — raised without moving its neighbours. */
      highlighted: {
        true: 'border-accent/60 shadow-lg ring-1 ring-accent/20',
        false: '',
      },
    },
    defaultVariants: { treatment: 'card', interactive: false, highlighted: false },
  },
)

/** Content inside a card, at the padding the nested-radius arithmetic assumes. */
export const CARD_BODY = 'flex flex-col p-6'

/**
 * A media plate flush inside a card: the card is `xl` (16), the plate sits 8 px in, so the plate is
 * `md` (8). This is the call prompt 38 requires every card-in-container to make through `innerRadius`.
 */
export const CARD_MEDIA = ['overflow-hidden', innerRadiusClass(CARD_RADIUS, CARD_PADDING_PX)].join(
  ' ',
)

/**
 * The icon plate a feature cell opens with. `accent-muted` under an accent glyph is the pairing
 * DESIGN_SYSTEM.md § Semantic tokens defines for exactly this, and it stays legible in both modes
 * without the block choosing a colour.
 */
export const CARD_ICON_PLATE =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-accent/20 bg-accent-muted text-accent'

export const CARD_TITLE = 'm-0 font-semibold text-foreground text-xl'

export const CARD_BODY_TEXT = 'mt-2 mb-0 text-pretty text-foreground-muted'
