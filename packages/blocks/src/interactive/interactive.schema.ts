import { z } from 'zod'

import { visibility } from '../scales'

/**
 * The category's shared vocabulary. Declared here rather than imported from `marketing` or `navigation`
 * for the reason each category before it declared its own: a size enum is a two-line contract, and a
 * cross-category import of one would tie a tab strip's geometry to a pricing table's file.
 *
 * Three sizes rather than the chrome's two, and the middle one is the marketing CTA's geometry exactly —
 * a button a user places is content density, and content beside content has to agree.
 */
export const CONTROL_SIZES = ['sm', 'md', 'lg'] as const

export type ControlSize = (typeof CONTROL_SIZES)[number]

export const controlSize = z.enum(CONTROL_SIZES)

/**
 * The four `packages/ui` Button offers, conceptually — prompt 40's requirement. `danger` is here because
 * a destructive action in a product UI is a real block, and it is the one variant whose colour carries
 * meaning rather than emphasis.
 */
export const CONTROL_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const

export type ControlVariant = (typeof CONTROL_VARIANTS)[number]

export const controlVariant = z.enum(CONTROL_VARIANTS)

export const LABEL_MAX_LENGTH = 48
export const BODY_MAX_LENGTH = 280
export const ICON_NAME_MAX_LENGTH = 32
export const ARIA_LABEL_MAX_LENGTH = 64

/**
 * A glyph by name, empty for none. A name the icon registry does not know draws nothing — the rule
 * `content/badge` states, and FILE_FORMAT.md § Security is why: a document's string never reaches module
 * resolution.
 */
export const iconNameField = z.string().max(ICON_NAME_MAX_LENGTH).default('')

/**
 * A labelled panel with a glyph and its own text, which is the shape `tabs`, `accordion`, `carousel` and
 * `modal-trigger` all need. `body` is not decoration: a slotted block still has to render from its props
 * alone, because a thumbnail render passes no children — ADR-206.
 */
export const panelItemSchema = z.object({
  label: z.string().min(1).max(LABEL_MAX_LENGTH),
  icon: iconNameField,
  body: z.string().max(BODY_MAX_LENGTH).default(''),
})

export type PanelItem = z.infer<typeof panelItemSchema>

/** Every block in the category answers the responsive visibility prop — ADR-117. */
export const interactiveFrameFields = () => ({ hidden: visibility })

/**
 * The frame for the blocks that are a labelled group: a tab list, a segmented control, a carousel region,
 * a colour-mode switch. The label is required rather than optional, because a group with no name is a
 * group a screen reader announces as "group" — ACCESSIBILITY.md § Non-negotiables 2.
 */
export const labelledFrameFields = (label: string) => ({
  ariaLabel: z.string().min(1).max(ARIA_LABEL_MAX_LENGTH).default(label),
  ...interactiveFrameFields(),
})

export type InteractiveFrameShape = { readonly hidden: boolean }

export type LabelledFrameShape = InteractiveFrameShape & { readonly ariaLabel: string }
